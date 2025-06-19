const Pedido = require('../models/Pedido');

const ESTADOS_VALIDOS = ['pendiente', 'aprobado', 'rechazado'];

const createPedido = async (pedidoData) => {
    const pedido = new Pedido(pedidoData);
    return await pedido.save();
}

const getAllPedidos = async () => {
    return await Pedido.find()
        .populate('usuario_id', 'nombre')
        .populate('aprobado_por', 'nombre')
        .populate('cervezas.cerveza', 'nombre');
};

const getPedidoById = async (id) => {
    return await Pedido.findOne({ id });
}

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
    deletePedidoById,
    updatePedido
};