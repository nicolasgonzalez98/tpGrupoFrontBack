const cervezaRepository = require('../repository/cervezaRepository');

const createCerveza = async (cervezaData) => {
    return await cervezaRepository.createCerveza(cervezaData);
};

const getAllCervezas = async () => {
    return await cervezaRepository.getAllCervezas();
};

const getCervezaById = async (id) => {
    return await cervezaRepository.getCervezaById(id);
};

const getCervezaByName = async (nombre) => {
    return await cervezaRepository.getCervezaByName(nombre);
};

const deleteCervezaById = async (id) => {
    return await cervezaRepository.deleteCervezaById(id);
};

const updateStockCerveza = async (id, cantidad) => {
    return await cervezaRepository.updateStockCerveza(id, cantidad);
};

module.exports = {
    createCerveza,
    getAllCervezas,
    getCervezaById,
    getCervezaByName,
    deleteCervezaById,
    updateStockCerveza
};