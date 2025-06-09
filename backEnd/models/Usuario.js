import mongoose from 'mongoose';

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  rol: { type: String, enum: ['admin', 'empleado', 'cliente'], required: true, default: "empleado"},
  activo: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Usuario', usuarioSchema);