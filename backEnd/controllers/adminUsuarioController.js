const usuarioService = require('../services/adminUsuarioService');

exports.createEmpleadoController = async (req, res) => {
    try {
        const empleadoData = req.body;
        res.send(await usuarioService.createEmpleadoService(empleadoData));
    } catch (error) {
        console.error("Error en createEmpleadoController:", error);
        if (error.message && error.message.includes('email ya está registrado')) {
            return res.status(409).json({ message: 'El email ya está registrado' });
        }
        // Mensaje genérico al cliente; el detalle queda solo en el log del servidor.
        res.status(500).json({ message: 'Error al crear empleado.' });
    }
};


exports.readUsersController = async (req, res) => {
    try {
        res.setHeader('Content-Type', 'application/json');
        res.status(200);
        res.send(await usuarioService.getAllUsuariosService());
    } catch (error) {
        console.error("Error en getUsuariosController:", error);
        res.status(500).json({ message: 'Error al obtener los usuarios.' });
    }
};

exports.updateUsuarioByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const usuarioActualizado = await usuarioService.updateUsuarioService(id, updateData);

        if (!usuarioActualizado) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.setHeader('Content-Type', 'application/json');
        res.status(200);
        res.json(usuarioActualizado);
    } catch (error) {
        console.error("Error en updateUsuarioById:", error);
        res.status(500).json({ message: "Error al actualizar el usuario." });
    }
};
