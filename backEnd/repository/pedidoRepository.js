const Pedido = require('../models/Pedido');

const ESTADOS_VALIDOS = ['pendiente', 'aprobado', 'rechazado'];

const createPedido = async (pedidoData) => {
    const pedido = new Pedido(pedidoData);
    return await pedido.save();
}

const getAllPedidos = async () => {
    return await Pedido.find().lean().exec();
}

const getPedidoById = async (id) => {
    return await Pedido.findOne({ _id: id });
}

const getPedidosByUsuario = async (usuarioId) => {
    return await Pedido.find({ usuario_id: usuarioId }).lean().exec();
};

const deletePedidoById = async (id) => {
    return await Pedido.findByIdAndDelete(id);
}

const updatePedido = async (id, { aprobado_por, estado }) => {
    if (estado && !ESTADOS_VALIDOS.includes(estado)) {
        throw new Error('Estado no válido');
    }

    const updateFields = {};
    if (aprobado_por) updateFields.aprobado_por = aprobado_por;
    if (estado) updateFields.estado = estado;
    if (estado === 'aprobado') updateFields.fecha_aprobacion = new Date();

    return await Pedido.findByIdAndUpdate(
        id,
        updateFields,
        { new: true }
    );
};

module.exports = {
    createPedido,
    getAllPedidos,
    getPedidoById,
    getPedidosByUsuario,
    deletePedidoById,
    updatePedido
};