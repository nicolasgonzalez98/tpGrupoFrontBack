const Cerveza = require('../models/Cerveza');

const createCerveza = async (cervezaData) => {
  const cerveza = new Cerveza(cervezaData);
  return await cerveza.save();
};

const findCervezaById = async (id) => {
  return await Cerveza.findOne({ id });
};

const findCervezaByName = async (nombre) => {
  return await Cerveza.findOne({ nombre });
};

const deleteCervezaById = async (id) => {
  return await Cerveza.findByIdAndDelete(id);
};

//TODO: validacion de stock y cantidad a descontar < 0 pasar al service
const updateStockCerveza = async (id, cantidad) => {
  const cerveza = await Cerveza.findById(id);
  if (!cerveza) return null;

  const nuevoStock = cerveza.stock_actual + cantidad;

  if (nuevoStock < 0) {
    throw new Error('El stock no puede ser negativo');
  }

  return await Cerveza.findByIdAndUpdate(
    id,
    { $inc: { stock_actual: cantidad } },
    { new: true }
  );
};



module.exports = {
  createCerveza,
  findCervezaById,
  findCervezaByName,
  deleteCervezaById,
  updateStockCerveza
};