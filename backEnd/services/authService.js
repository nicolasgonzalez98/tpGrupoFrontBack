const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createUser, findUserByEmail } = require('../repository/userRepository');

const SECRET_KEY = "TpCervezas"

const register = async ({ nombre, email, password }) => {
    const existingUser = await findUserByEmail(email);
    if (existingUser) return res.status(400).json({ message: 'El email ya está registrado' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await createUser({ nombre, email, password: hashedPassword });

    return {
      message: 'Usuario creado',
      user: { id: newUser._id, email: newUser.email }
    };
};

const login = async ({ email, password }) => {
  
  
    const user = await findUserByEmail(email);
    
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ message: 'Contraseña incorrecta' });

    const token = jwt.sign({ id: user._id, rol: user.rol }, SECRET_KEY, { expiresIn: '1h' });

    return {
      message: 'Login exitoso', 
      token, 
      user: { id: user._id, email: user.email, nombre: user.nombre }
    };
};

module.exports = {
  register,
  login,
};