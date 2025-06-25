const usuarioService = require('../services/adminUsuarioService');

exports.createEmpleadoController = async (req, res) => {
    try {
        console.log("CONTROLLER - createEmpleadoController: Petición HTTP recibida.");
        const empleadoData = req.body; 
        res.send(await usuarioService.createEmpleadoService(empleadoData));
    } catch (error) {
        console.error("Error en createEmpleadoController:", error);
        if (error.message && error.message.includes('email ya está registrado')) {
            return res.status(409).json({ message: error.message });
        }
        res.status(500).send( { code: 500, message: "Error al crear empleado." + error.message})
    }
};


exports.readUsersController = async (req, res) => {
    try {
        console.log("CONTROLLER - getUsuariosController: Petición HTTP recibida.");
        res.setHeader('Content-Type', 'application/json');
        res.status(200);
        res.send(await usuarioService.getAllUsuariosService());
    } catch (error) {
        console.error("Error en getUsuariosController:", error);
        res.status(500).send({ code: 500, message: "Error al obtener los usuarios: " + error.message });
    }
};

exports.updateUsuarioByIdController = async (req, res) => {
    try {
        const { id } = req.params;     
        const updateData = req.body;   

        console.log(`CONTROLLER Recibida solicitud PATCH para ID: ${id}, Datos: ${JSON.stringify(updateData)}`);

        const usuarioActualizado = await usuarioService.updateUsuarioService(id, updateData);

        if (!usuarioActualizado) {
            return res.status(404).json({ message: "Usuario no encontrado con el ID: " + id });
        }

        res.setHeader('Content-Type', 'application/json');
        res.status(200);
        res.json(usuarioActualizado); 
    } catch (error) {
        console.error("Error en updateUsuarioById:", error);
        res.status(500).json({ message: "Error al actualizar el usuario." });
    }
};
