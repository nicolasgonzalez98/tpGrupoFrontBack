const adminUsuarioRepository = require('../repository/adminUsuarioRepository');
const userRepository = require('../repository/userRepository')
const bcrypt = require('bcrypt');

exports.createEmpleadoService = async ({ nombre, email, password }) => {
    try {
        const usuarioExistente = await userRepository.findUserByEmail(email);
        if (usuarioExistente) {
            const error = new Error('El email ya está registrado');
            error.status = 409;
            throw error;
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const empleadoData = {
            nombre,
            email,
            password: hashedPassword,
            rol: 'empleado'
        };

        const nuevoEmpleado = await adminUsuarioRepository.createEmpleado(empleadoData);
        // No devolver el hash de la contraseña al cliente.
        const { password: _omit, ...empleadoSinPassword } = nuevoEmpleado.toObject();
        return empleadoSinPassword;
    } catch (error) {
        console.error("Error en createEmpleadoService:", error.message);
        throw error;
    }
};

exports.getAllUsuariosService = async () => {
    try {
        return await adminUsuarioRepository.getAllUsuariosRepository();
    } catch (error) {
        console.error("Error en getAllUsuariosService:", error.message);
        throw new Error("Error en la capa de servicio al obtener usuarios: " + error.message);
    }
};

exports.updateUsuarioService = async (id, updateData) => {
    // Whitelist de campos permitidos: evita mass-assignment (ej. cambiar password o _id por el body).
    const permitido = {};
    ['nombre', 'email', 'rol', 'activo'].forEach((campo) => {
        if (updateData[campo] !== undefined) {
            permitido[campo] = updateData[campo];
        }
    });
    return await adminUsuarioRepository.updateUsuario(id, permitido);
};
