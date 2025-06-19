const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  rol: { type: String, enum: ['admin', 'empleado', 'cliente'], required: true, default: "cliente"},
  activo: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Usuario', usuarioSchema);