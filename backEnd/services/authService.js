const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createUser, findUserByEmail } = require('../repository/userRepository');
// Única fuente del secret (definido y validado en el middleware de auth).
const { SECRET_KEY } = require('../middlewares/auth');

const register = async ({ nombre, email, password }) => {
    const existingUser = await findUserByEmail(email);
    if (existingUser){
      const error = new Error('El email ya está registrado');
      error.status = 400;
      throw error;
    };

    const hashedPassword = await bcrypt.hash(password, 12);

    // El registro público SIEMPRE crea un cliente. El `rol` del body se ignora a propósito:
    // confiar en él permitía auto-registrarse como 'empleado' (escalada de privilegios).
    // Los empleados se crean solo por la ruta admin (POST /api/usuarios).
    const newUser = await createUser({ nombre, email, password: hashedPassword, rol: 'cliente' });

    return {
      message: 'Usuario creado',
      user: { _id: newUser._id, email: newUser.email, rol: newUser.rol }
    };
};

const login = async ({ email, password }) => {
    const user = await findUserByEmail(email);

    // Respuesta uniforme para "usuario inexistente" y "contraseña incorrecta":
    // evita enumeración de cuentas (no se revela si el email existe).
    if (!user) {
        const error = new Error('Credenciales inválidas');
        error.status = 401;
        throw error;
    };

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        const error = new Error('Credenciales inválidas');
        error.status = 401;
        throw error;
    };

    // El estado "inactivo" solo se revela a quien ya presentó credenciales válidas.
    if (!user.activo) {
        const error = new Error('La cuenta está inactiva. Contactá al administrador.');
        error.status = 403;
        throw error;
    }

    const token = jwt.sign({ _id: user._id, rol: user.rol }, SECRET_KEY, { expiresIn: '1h' });

    return {
      message: 'Login exitoso', 
      token, 
      user: { _id: user._id, email: user.email, nombre: user.nombre, rol: user.rol, activo: user.activo }
    };
};

module.exports = {
  register,
  login,
};