const Usuario = require('../models/Usuario');

exports.createEmpleado = async (userData) => {
    try {
        const user = new Usuario(userData);
        await user.save();
        return user;
    } catch (error) {
        console.error("REPOSITORY - createEmpleado - Error:", error.message);
        throw new Error("Error al intentar crear el nuevo usuario: " + error.message);
    }
};

// Trae todos los usuarios SIN el campo password (no exponer el hash).
exports.getAllUsuariosRepository = async () => {
    try {
        return await Usuario.find().select('-password');
    } catch (error) {
        console.error("Error en getAllUsuariosRepository:", error.message);
        throw new Error("Error al traer los usuarios: " + error.message);
    }
};

// Actualiza un usuario. { new: true } devuelve el doc actualizado; runValidators valida el enum de rol.
exports.updateUsuario = async (id, updateData) => {
    try {
        const usuarioActualizado = await Usuario.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).select('-password');
        return usuarioActualizado;
    } catch (error) {
        console.error("[Usuario Repository] Error en updateUsuario:", error.message);
        throw new Error(`Error al actualizar el usuario con ID ${id}: ${error.message}`);
    }
};
