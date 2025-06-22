const authService = require('../services/authService');

const register = async (req, res) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Error al registrar usuario' });
  }
};

const login= async (req, res) => {
  try {
    const result = await authService.login(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error al iniciar sesión' });
  }
};

module.exports = {
  register,
  login,
};
