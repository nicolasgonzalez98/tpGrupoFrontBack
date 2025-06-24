const pedidoService = require('../services/pedidoService');

const createPedido = async (req, res) => {
  try {
    const { usuario_id, cervezas } = req.body;

    if (!usuario_id || !Array.isArray(cervezas) || cervezas.length === 0) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    for (const item of cervezas) {
      if (!item.cerveza || !item.cantidad) {
        return res.status(400).json({ error: 'Cada cerveza debe tener id y cantidad' });
      }
    }

    const nuevoPedido = await pedidoService.createPedido({
      usuario_id,
      cervezas,
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

const getPedidosByUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    if (!usuarioId) {
      return res.status(400).json({ error: 'ID de usuario requerido' });
    }
    const pedidos = await pedidoService.getPedidosByUsuario(usuarioId);
    res.status(200).json(pedidos);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

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
  getPedidosByUsuario,
  deletePedidoById,
  updatePedido
}