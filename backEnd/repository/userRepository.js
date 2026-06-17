const User = require('../models/Usuario');

const createUser = async (userData) => {
  const user = new User(userData);
  return await user.save();
};

const findUserByEmail = async (email) => {
  // Coerción a string para evitar NoSQL injection (ej. { $ne: null } en el body).
  return await User.findOne({ email: typeof email === 'string' ? email : '' });
};

module.exports = {
  createUser,
  findUserByEmail,
};