const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const authController = require('../controllers/authController');

// Limita intentos de login/registro por IP para frenar fuerza bruta y abuso.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,                  // 10 intentos por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos. Probá de nuevo más tarde.' },
});

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);

module.exports = router;
