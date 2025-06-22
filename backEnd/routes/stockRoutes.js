const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');

router.post('/', stockController.createCerveza);

router.get('/', stockController.getAllCervezas);

router.get('/:id', stockController.getCervezaById);

router.get('/:nombre', stockController.getCervezaByName);

router.delete('/:id', stockController.deleteCervezaById);

router.patch('/:id', stockController.updateCerveza);

module.exports = router;