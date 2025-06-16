const usuarioRepository = require('../repository/UsuarioRepository'); 

exports.getAllUsuariosService = async () => {
    try {
        const usuarios = await usuarioRepository.getAllUsuariosRepository(); 
        console.log("SERVICE - getAllUsuariosService: Usuarios obtenidos del repositorio.");
        return usuarios; 
    } catch (error) {
        console.error("Error en getAllUsuariosService:", error);
        // Propaga el error para que el controlador lo maneje
        throw new Error("Error en la capa de servicio al obtener usuarios: " + error.message);
    }
};



