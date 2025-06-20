const express = require('express');
const router = express.Router();
const cervezaController = require('../controllers/cervezaController');

router.get('/', cervezaController.getAllCervezas);

router.get('/:id', cervezaController.getCervezaById);

module.exports = router;