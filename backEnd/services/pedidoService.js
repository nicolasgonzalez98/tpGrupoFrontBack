const pedidoRepository = require('../repository/pedidoRepository');

const createPedido = async (pedidoData) => {
    return await pedidoRepository.createPedido(pedidoData);
}

const getAllPedidos = async () => {
    return await pedidoRepository.getAllPedidos();
}

const getPedidoById = async (id) => {
    return await pedidoRepository.getPedidoById(id);
}

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
    deletePedidoById,
    updatePedido
}