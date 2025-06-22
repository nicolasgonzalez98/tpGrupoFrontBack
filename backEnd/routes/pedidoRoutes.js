const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');

router.post('/', pedidoController.createPedido);

router.get('/', pedidoController.getAllPedidos);

router.get('/:id', pedidoController.getPedidoById);

router.delete('/:id', pedidoController.deletePedidoById);

router.patch('/:id', pedidoController.updatePedido);

module.exports = router;