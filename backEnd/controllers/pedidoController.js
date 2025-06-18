

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
};