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

//metodo para actualizar rol y activo de usuario (utilizamos el mismo metodo para ambos casos, mongoDB lo permite)
exports.updateUsuario = async (id, updateData) => {
    try {
        console.log(`REPOSITORY Actualizando usuario - ID: ${id}, Datos: ${JSON.stringify(updateData)}`);

        // Mongoose: Busca el documento por ID y actualiza solo los campos proporcionados en 'updateData'.
        // { new: true }: Devuelve el documento *actualizado*.
        // { runValidators: true }: Ejecuta las validaciones del esquema (ej. para el campo 'rol').
        const usuarioActualizado = await Usuario.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

        if (!usuarioActualizado) {
            console.error("No existe ese usuario en la base de datos", error);
        }
        return usuarioActualizado;
    } catch (error) {
        console.error("[Usuario Repository] Error en updateUsuario:", error);
        throw new Error(`Error al actualizar el usuario con ID ${id}: ${error.message}`);
    }
};