const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/adminUsuarioController');
const { verifyToken, requireRole } = require('../middlewares/auth');

// Gestión de usuarios: solo admin.
router.use(verifyToken, requireRole('admin'));

router.get('/', usuarioController.readUsersController);
router.patch('/:id', usuarioController.updateUsuarioByIdController);
router.post('/', usuarioController.createEmpleadoController)

module.exports = router;