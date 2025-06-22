const cervezaService = require("../services/cervezaService");

const createCerveza = async (req, res) => {
    try {
        const { nombre, tipo, stock_actual, stock_minimo, activo } = req.body;

        if (!nombre || typeof nombre !== "string") {
            return res.status(400).json({ error: "El nombre es requerido y debe ser un string." });
        }
        if (!tipo || typeof tipo !== "string") {
            return res.status(400).json({ error: "El tipo es requerido y debe ser un string." });
        }
        if (stock_actual && typeof stock_actual !== "number") {
            return res.status(400).json({ error: "El stock_actual debe ser un número." });
        }
        if (stock_minimo && typeof stock_minimo !== "number") {
            return res.status(400).json({ error: "El stock_minimo debe ser un número." });
        }
        if (activo && typeof activo !== "boolean") {
            return res.status(400).json({ error: "El campo activo debe ser booleano." });
        }

        const cervezaData = { nombre, tipo, stock_actual, stock_minimo, activo };
        const cerveza = await cervezaService.createCerveza(cervezaData);
        res.status(201).json(cerveza);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getAllCervezas = async (req, res) => {
    try {
        const cervezas = await cervezaService.getAllCervezas();
        res.status(200).json(cervezas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getCervezaById = async (req, res) => {
    try {
        const cerveza = await cervezaService.getCervezaById(req.params.id);
        if (!cerveza) {
            return res.status(404).json({ error: "Cerveza no encontrada" });
        }
        res.status(200).json(cerveza);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteCervezaById = async (req, res) => {
    try {
        const cerveza = await cervezaService.deleteCervezaById(req.params.id);
        if (!cerveza) {
            return res.status(404).json({ error: "Cerveza no encontrada" });
        }
        res.status(200).json({ message: "Cerveza eliminada correctamente" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateCerveza = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, tipo, stock_actual, stock_minimo, activo } = req.body;

        if (!id) {
            return res.status(400).json({ error: "ID de cerveza requerido" });
        }

        const updateData = {};
        if (nombre) updateData.nombre = nombre;
        if (tipo) updateData.tipo = tipo;
        if (stock_actual !== undefined) updateData.stock_actual = stock_actual;
        if (stock_minimo !== undefined) updateData.stock_minimo = stock_minimo;
        if (activo !== undefined) updateData.activo = activo;

        const cervezaActualizada = await cervezaService.updateCerveza(id, updateData);
        if (!cervezaActualizada) {
            return res.status(404).json({ error: "Cerveza no encontrada" });
        }
        res.status(200).json(cervezaActualizada);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createCerveza,
    getAllCervezas,
    getCervezaById,
    deleteCervezaById,
    updateCerveza
};
