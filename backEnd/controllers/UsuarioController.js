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


