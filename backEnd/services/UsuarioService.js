const usuarioRepository = require('../repository/UsuarioRepository'); 

exports.getAllUsuariosService = async () => {
    try {
        const usuarios = await usuarioRepository.getAllUsuariosRepository(); 
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
        return await usuarioRepository.updateUsuario(id, updateData);
    } catch (error) {
        console.log("Error en updateUsuario:" + error);
        throw error("Error en el service" + error)
    }
};


