const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/adminUsuarioController'); 

router.get('/', usuarioController.readUsersController);
router.patch('/:id', usuarioController.updateUsuarioByIdController);
router.post('/', usuarioController.createEmpleadoController)
module.exports = router;