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
    const error = new Error('El stock_actual no puede ser negativo');
    error.status = 400;
    throw error;
  }
  if (updateData.stock_minimo !== undefined && updateData.stock_minimo < 0) {
    const error = new Error('El stock_minimo no puede ser negativo');
    error.status = 400;
    throw error;
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

// Descuento atómico y condicional: solo descuenta si hay stock suficiente.
// Devuelve true si descontó, false si no había stock (evita sobreventa por concurrencia).
const descontarStockSiHay = async (id, cantidad) => {
    const actualizada = await Cerveza.findOneAndUpdate(
        { _id: id, stock_actual: { $gte: cantidad } },
        { $inc: { stock_actual: -cantidad } },
        { new: true }
    );
    return actualizada !== null;
};

// Restituye stock (al rechazar/eliminar un pedido, o para revertir un descuento parcial).
const restituirStock = async (id, cantidad) => {
    return await Cerveza.findByIdAndUpdate(
        id,
        { $inc: { stock_actual: cantidad } },
        { new: true }
    );
};

module.exports = {
  createCerveza,
  getCervezaById,
  getAllCervezas,
  descontarStockActualById,
  descontarStockSiHay,
  restituirStock,
  deleteCervezaById,
  updateCerveza
};