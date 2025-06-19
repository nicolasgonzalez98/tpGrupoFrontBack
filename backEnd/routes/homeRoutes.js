const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');

router.get('/', homeController.getAllCervezas);

router.get('/:id', homeController.getCervezaById);

module.exports = router;