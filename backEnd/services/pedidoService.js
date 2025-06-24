const pedidoRepository = require('../repository/pedidoRepository');
const cervezaRepository = require('../repository/cervezaRepository');

const createPedido = async (pedidoData) => {
    for (const item of pedidoData.cervezas) {
        const cerveza = await cervezaRepository.getCervezaById(item.cerveza);
        if (!cerveza) {
            throw new Error(`Cerveza con ID ${item.cerveza} no encontrada`);
        }
        if (cerveza.stock_actual < item.cantidad) {
            throw new Error(`Stock insuficiente para ${cerveza.nombre || 'la cerveza seleccionada'}`);
        }
    }

    for (const item of pedidoData.cervezas) {
        await cervezaRepository.descontarStockActualById(item.cerveza, item.cantidad);
    }

    const pedido = await pedidoRepository.createPedido(pedidoData);
    return pedido;
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
    return await pedidoRepository.deletePedidoById(id);
}

const updatePedido = async (id, { aprobado_por, estado }) => {
    return await pedidoRepository.updatePedido(id, { aprobado_por, estado });
}

module.exports = {
    createPedido,
    getAllPedidos,
    getPedidoById,
    getPedidosByUsuario,
    deletePedidoById,
    updatePedido
}