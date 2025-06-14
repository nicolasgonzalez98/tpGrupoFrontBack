import mongoose from 'mongoose';

//En duda
const pedidoClienteSchema = new mongoose.Schema({
  pedido_id: { type: mongoose.Schema.Types.ObjectId, ref: 'PedidoCliente', required: true },
  cerveza_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cerveza', required: true },
  cantidad: { type: Number, required: true }
}, { timestamps: true });

export default mongoose.model('PedidoCerveza', pedidoClienteSchema);
