const pedidoRepository = require('../repository/pedidoRepository');
const cervezaRepository = require('../repository/cervezaRepository');

const ESTADOS_CON_STOCK_RESERVADO = ['pendiente', 'aprobado'];

const createPedido = async (pedidoData) => {
    // 1) Validar que todas las cervezas existan.
    for (const item of pedidoData.cervezas) {
        const cerveza = await cervezaRepository.getCervezaById(item.cerveza);
        if (!cerveza) {
            throw new Error(`Cerveza con ID ${item.cerveza} no encontrada`);
        }
    }

    // 2) Descontar de forma atómica (condicional). Si alguno falla por falta de stock,
    //    se revierten los descuentos ya hechos (no hay transacción multi-documento).
    const descontadas = [];
    for (const item of pedidoData.cervezas) {
        const ok = await cervezaRepository.descontarStockSiHay(item.cerveza, item.cantidad);
        if (!ok) {
            for (const d of descontadas) {
                await cervezaRepository.restituirStock(d.cerveza, d.cantidad);
            }
            const cerveza = await cervezaRepository.getCervezaById(item.cerveza);
            throw new Error(`Stock insuficiente para ${cerveza?.nombre || 'la cerveza seleccionada'}`);
        }
        descontadas.push(item);
    }

    // 3) Crear el pedido. Si falla, se restituye todo lo descontado.
    try {
        return await pedidoRepository.createPedido(pedidoData);
    } catch (err) {
        for (const d of descontadas) {
            await cervezaRepository.restituirStock(d.cerveza, d.cantidad);
        }
        throw err;
    }
};

const getAllPedidos = async () => {
    return await pedidoRepository.getAllPedidos();
}

const getPedidoById = async (id) => {
    return await pedidoRepository.getPedidoById(id);
}

const getPedidosByUsuario = async (usuarioId) => {
    return await pedidoRepository.getPedidosByUsuario(usuarioId);
};

const deletePedidoById = async (id) => {
    const pedido = await pedidoRepository.getPedidoById(id);
    if (!pedido) return null;

    const eliminado = await pedidoRepository.deletePedidoById(id);

    // Si el pedido tenía stock reservado (no estaba rechazado), se restituye.
    if (ESTADOS_CON_STOCK_RESERVADO.includes(pedido.estado)) {
        for (const item of pedido.cervezas) {
            await cervezaRepository.restituirStock(item.cerveza, item.cantidad);
        }
    }

    return eliminado;
}

const updatePedido = async (id, { aprobado_por, estado }) => {
    const pedidoActual = await pedidoRepository.getPedidoById(id);
    if (!pedidoActual) return null;

    const actualizado = await pedidoRepository.updatePedido(id, { aprobado_por, estado });

    const estabaReservado = ESTADOS_CON_STOCK_RESERVADO.includes(pedidoActual.estado);
    const quedaReservado = ESTADOS_CON_STOCK_RESERVADO.includes(estado);

    if (estado) {
        if (estabaReservado && estado === 'rechazado') {
            // Se libera el stock al rechazar.
            for (const item of pedidoActual.cervezas) {
                await cervezaRepository.restituirStock(item.cerveza, item.cantidad);
            }
        } else if (!estabaReservado && quedaReservado) {
            // Se vuelve a reservar (ej. de rechazado a aprobado/pendiente).
            for (const item of pedidoActual.cervezas) {
                await cervezaRepository.descontarStockActualById(item.cerveza, item.cantidad);
            }
        }
    }

    return actualizado;
}

module.exports = {
    createPedido,
    getAllPedidos,
    getPedidoById,
    getPedidosByUsuario,
    deletePedidoById,
    updatePedido
}
