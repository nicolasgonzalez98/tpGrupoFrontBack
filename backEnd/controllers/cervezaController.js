const cervezaService = require('../services/cervezaService');

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
            return res.status(404).json({ error: 'Cerveza no encontrada' });
        }
        res.status(200).json(cerveza);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllCervezas,
    getCervezaById
};