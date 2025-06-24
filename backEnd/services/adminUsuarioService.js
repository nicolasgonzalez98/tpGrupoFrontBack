const adminUsuarioRepository = require('../repository/adminUsuarioRepository'); 
const userRepository = require('../repository/userRepository')
const bcrypt = require('bcrypt');

exports.createEmpleadoService = async ({ nombre, email, password }) => { 
    try {
        console.log(`SERVICE - createEmpleadoService - Datos recibidos: ${JSON.stringify({ nombre, email, password })}`);

        const usuarioExistente = await userRepository.findUserByEmail(email); 
        if (usuarioExistente) {
            const error = new Error('El email ya está registrado');
            error.status = 409; 
            throw error;
        }

        const hashedPassword = await bcrypt.hash(password, 10); 

        const empleadoData = { 
            nombre, 
            email, 
            password: hashedPassword, 
            rol: 'empleado' // 
        }; 

        const nuevoEmpleado = await adminUsuarioRepository.createEmpleado(empleadoData); 
        
        console.log("SERVICE - createEmployeeService: Empleado creado exitosamente.");
        return nuevoEmpleado; // 
    } catch (error) {
        console.error("Error en createEmpleadoService:", error); 
        throw error; 
    }
};

exports.getAllUsuariosService = async () => {
    try {
        const usuarios = await adminUsuarioRepository.getAllUsuariosRepository(); 
        console.log("SERVICE - getAllUsuariosService: Usuarios obtenidos del repositorio.");
        return usuarios; 
    } catch (error) {
        console.error("Error en getAllUsuariosService:", error);
        throw new Error("Error en la capa de servicio al obtener usuarios: " + error.message);
    }
};

exports.updateUsuarioService = async (id, updateData) => {
    try {
        console.log(`SERVICE updateUsuarioService - ID: ${id}, Datos: ${JSON.stringify(updateData)}`);
        return await adminUsuarioRepository.updateUsuario(id, updateData);
    } catch (error) {
        console.log("Error en updateUsuario:" + error);
        throw error("Error en el service" + error)
    }
};


