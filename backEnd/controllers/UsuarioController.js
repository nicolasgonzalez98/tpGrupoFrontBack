const usuarioService = require('../services/UsuarioService');

exports.readUsersController = async (req, res) => {
    try {
        console.log("CONTROLLER - getUsuariosController: Petición HTTP recibida.");
        res.setHeader('Content-Type', 'application/json');
        res.status(200);
        res.send(await usuarioService.getAllUsuariosService());
    } catch (error) {
        console.error("Error en getUsuariosController:", error);
        // Captura el error propagado y envía una respuesta de error al cliente
        res.status(500).send({ code: 500, message: "Error al obtener los usuarios: " + error.message });
    }
};

exports.updateUsuarioByIdController = async (req, res) => {
    try {
        const { id } = req.params;     // Obtiene el ID del usuario de la URL (ej. /api/usuarios/ID_DEL_USUARIO)
        const updateData = req.body;   // Obtiene los datos a actualizar del cuerpo de la solicitud (ej. { "activo": true } o { "rol": "admin" })

        console.log(`CONTROLLER Recibida solicitud PATCH para ID: ${id}, Datos: ${JSON.stringify(updateData)}`);

        const usuarioActualizado = await usuarioService.updateUsuarioService(id, updateData);

        if (!usuarioActualizado) {
            return res.status(404).json({ message: "Usuario no encontrado con el ID: " + id });
        }

        // Si la actualización fue exitosa, devuelve el usuario actualizado
        res.setHeader('Content-Type', 'application/json');
        res.status(200);
        res.json(usuarioActualizado); 
    } catch (error) {
        console.error("Error en updateUsuarioById:", error);
        res.status(500).json({ message: "Error al actualizar el usuario." });
    }
};
