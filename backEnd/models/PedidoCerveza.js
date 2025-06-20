import mongoose from 'mongoose';

const pedidoCervezaSchema = new mongoose.Schema({
  pedido_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Pedido', required: true },
  cerveza_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cerveza', required: true },
  cantidad: { type: Number, required: true }
});

export default mongoose.model('PedidoCerveza', pedidoCervezaSchema);
