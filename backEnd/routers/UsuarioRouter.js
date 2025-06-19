const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/UsuarioController'); 

router.get('/', usuarioController.readUsersController);
router.patch('/:id', usuarioController.updateUsuarioByIdController);

module.exports = router;