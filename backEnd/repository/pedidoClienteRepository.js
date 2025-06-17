const pedidoCliente = require('../models/PedidoCliente');

const createPedidoCliente = async (pedidoData) => {
    const pedido = new pedidoCliente(pedidoData);
    return await pedido.save();
}

const getAllPedidosClientes = async () => {
    return await pedidoCliente.find().populate('cerveza_id');
}