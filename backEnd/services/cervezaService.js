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

const updateCerveza = async (id, updateData) => {
    return await cervezaRepository.updateCerveza(id, updateData);
};

module.exports = {
    createCerveza,
    getAllCervezas,
    getCervezaById,
    getCervezaByName,
    deleteCervezaById,
    updateCerveza
};