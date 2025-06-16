const Usuario = require('../models/Usuario');

//metodo get para traer a todos los usuarios
exports.getAllUsuariosRepository = async () => {
    try {
        const usuarios = await Usuario.find(); 
        console.log(usuarios); 
        return usuarios;
    } catch (error) {
        console.error("Error en getAllUsuariosRepository:", error);
        throw new Error("Error al traer los usuarios: " + error.message);
    }
};

