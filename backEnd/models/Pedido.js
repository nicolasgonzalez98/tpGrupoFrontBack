const mongoose = require('mongoose');

const pedidoSchema = new mongoose.Schema({
  usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  fecha: { type: Date, default: Date.now },
  estado: { type: String, enum: ['pendiente', 'aprobado', 'rechazado'], default: 'pendiente' },
  aprobado_por: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
  fecha_aprobacion: { type: Date, default: null },
  cervezas: [
    {
      cerveza: { type: mongoose.Schema.Types.ObjectId, ref: 'Cerveza', required: true },
      cantidad: { type: Number, required: true, min: 1 }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Pedido', pedidoSchema);