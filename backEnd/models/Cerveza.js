const mongoose = require('mongoose');

const cervezaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  tipo: { type: String, required: true },
  stock_actual: { type: Number, default: 0 },
  stock_minimo: { type: Number, default: 0 },
  activo: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Cerveza', cervezaSchema);
