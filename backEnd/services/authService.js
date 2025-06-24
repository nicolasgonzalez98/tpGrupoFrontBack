const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createUser, findUserByEmail } = require('../repository/userRepository');

const SECRET_KEY = "TpCervezas"

const register = async ({ nombre, email, password, rol }) => {
    let newUser
    const existingUser = await findUserByEmail(email);
    if (existingUser){ 
      const error = new Error('El email ya está registrado');
      error.status = 400;
      throw error;
    };

    const hashedPassword = await bcrypt.hash(password, 10);

    if(rol == "empleado"){
      newUser = await createUser({ nombre, email, password: hashedPassword, rol: rol });  
    }else{
      newUser = await createUser({ nombre, email, password: hashedPassword });
    }

    return {
      message: 'Usuario creado',
      user: { id: newUser._id, email: newUser.email, rol: newUser.rol }
    };
};

const login = async ({ email, password }) => {
    const user = await findUserByEmail(email);
    
    if (!user) { 
        const error = new Error('Usuario no encontrado');
        error.status = 404;
        throw error;
    };

    if(!user.activo){
      const error = new Error("El usuario no esta activo.")
      error.status = 404;
      throw error;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        const error = new Error('Contraseña incorrecta');
        error.status = 401;
        throw error;
    };

    const token = jwt.sign({ id: user._id, rol: user.rol }, SECRET_KEY, { expiresIn: '1h' });

    return {
      message: 'Login exitoso', 
      token, 
      user: { id: user._id, email: user.email, nombre: user.nombre, rol: user.rol, activo: user.activo }
    };
};

module.exports = {
  register,
  login,
};