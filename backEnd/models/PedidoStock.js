import mongoose from 'mongoose';

const pedidoStockSchema = new mongoose.Schema({
  usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  fecha: { type: Date, default: Date.now },
  estado: { type: String, enum: ['pendiente', 'aprobado', 'rechazado'], default: 'pendiente' },
  aprobado_por: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
  fecha_aprobacion: { type: Date, default: null },
}, { timestamps: true });

export default mongoose.model('Pedido', pedidoStockSchema);
