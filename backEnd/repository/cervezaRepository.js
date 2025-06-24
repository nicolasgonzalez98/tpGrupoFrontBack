const Cerveza = require('../models/Cerveza');

const createCerveza = async (cervezaData) => {
  const cerveza = new Cerveza(cervezaData);
  return await cerveza.save();
};

const getAllCervezas = async () => {
  return await Cerveza.find();
}

const getCervezaById = async (id) => {
  return await Cerveza.findOne({_id: id});
};

const deleteCervezaById = async (id) => {
  return await Cerveza.findByIdAndDelete(id);
};

const updateCerveza = async (id, updateData) => {
  if (updateData.stock_actual !== undefined && updateData.stock_actual < 0) {
    throw new Error('El stock_actual no puede ser negativo');
  }
  if (updateData.stock_minimo !== undefined && updateData.stock_minimo < 0) {
    throw new Error('El stock_minimo no puede ser negativo');
  }

  return await Cerveza.findByIdAndUpdate(
    id,
    updateData,
    { new: true }
  );
};

const descontarStockActualById = async (id, cantidad) => {
    return await Cerveza.findByIdAndUpdate(
        id,
        { $inc: { stock_actual: -cantidad } },
        { new: true }
    );
};

module.exports = {
  createCerveza,
  getCervezaById,
  getAllCervezas,
  descontarStockActualById,
  deleteCervezaById,
  updateCerveza
};