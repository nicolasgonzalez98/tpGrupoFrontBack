const express = require('express');
const router = express.Router();
const cervezaController = require('../controllers/cervezaController');
const { verifyToken } = require('../middlewares/auth');

// Catálogo: requiere sesión válida (cualquier rol autenticado).
router.get('/', verifyToken, cervezaController.getAllCervezas);

router.get('/:id', verifyToken, cervezaController.getCervezaById);

module.exports = router;