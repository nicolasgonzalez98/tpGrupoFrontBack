const express = require('express');
const router = express.Router();

//const { register_controller, login_controller } = require('../controllers/authController')
const { register, login} = require("../controllers/authController")

router.post('/register', register);
router.post('/login', login);

module.exports = router;
