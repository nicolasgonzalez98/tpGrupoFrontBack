const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { verifyToken, requireRole } = require('../middlewares/auth');

// Toda la gestión de stock es solo para admin/empleado.
router.use(verifyToken, requireRole('admin', 'empleado'));

router.post('/', stockController.createCerveza);

router.get('/', stockController.getAllCervezas);

router.get('/:id', stockController.getCervezaById);

router.delete('/:id', stockController.deleteCervezaById);

router.patch('/:id', stockController.updateCerveza);

module.exports = router;