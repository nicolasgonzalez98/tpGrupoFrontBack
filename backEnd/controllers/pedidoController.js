const pedidoService = require('../services/pedidoService');

const createPedido = async (req, res) => {
  try {
    const { usuario_id, cerveza_id, cantidad } = req.body;

    if (!usuario_id || !cerveza_id || !cantidad) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    const nuevoPedido = await pedidoService.createPedido({
      usuario_id,
      cerveza_id,
      cantidad,
      estado: 'pendiente'
    });

    res.status(201).json(nuevoPedido);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

const getAllPedidos = async (req, res) => {
  try {
    const pedidos = await pedidoService.getAllPedidos();
    res.status(200).json(pedidos);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

const getPedidoById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ error: 'ID de pedido requerido' });
    }
    const pedido = await pedidoService.getPedidoById(req.params.id);
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    res.status(200).json(pedido);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

const deletePedidoById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ error: 'ID de pedido requerido' });
    }
    const pedidoEliminado = await pedidoService.deletePedidoById(req.params.id);
    if (!pedidoEliminado) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    res.status(200).json({ message: 'Pedido eliminado correctamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

const updatePedido = async (req, res) => {
  try {
    const { aprobado_por, estado } = req.body;
    const pedidoActualizado = await pedidoService.updatePedido(req.params.id, { aprobado_por, estado });
    if (!pedidoActualizado) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    res.status(200).json(pedidoActualizado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

module.exports = {
  createPedido,
  getAllPedidos,
  getPedidoById,
  deletePedidoById,
  updatePedido
}