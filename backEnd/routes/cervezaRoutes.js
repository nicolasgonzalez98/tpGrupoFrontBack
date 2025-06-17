const express = require('express');
const router = express.Router();
const cervezaController = require('../controllers/cervezaController');

router.post('/create', cervezaController.createCerveza);

router.get('/', cervezaController.getAllCervezas);

router.get('/:id', cervezaController.getCervezaById);

router.get('/:nombre', cervezaController.getCervezaByName);

router.delete('/:id', cervezaController.deleteCervezaById);

router.patch('/update/:id', cervezaController.updateStockCerveza);

module.exports = router;