const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');
const { verifyToken, requireRole } = require('../middlewares/auth');

// Todas las rutas de pedido requieren sesión válida.
router.use(verifyToken);

// Crear pedido: solo cliente (el usuario_id se toma del token en el controller).
router.post('/', requireRole('cliente'), pedidoController.createPedido);

// Listar todos: admin/empleado.
router.get('/', requireRole('admin', 'empleado'), pedidoController.getAllPedidos);

// Lecturas individuales / por usuario: cualquier rol autenticado.
router.get('/:id', pedidoController.getPedidoById);
router.get('/usuario/:usuarioId', pedidoController.getPedidosByUsuario);

// Gestionar (eliminar / aprobar / rechazar): admin/empleado.
router.delete('/:id', requireRole('admin', 'empleado'), pedidoController.deletePedidoById);
router.patch('/:id', requireRole('admin', 'empleado'), pedidoController.updatePedido);

module.exports = router;