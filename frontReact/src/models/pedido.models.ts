// Equivalente a frontEnd/src/app/models/pedido.models.ts
export interface IPedido {
  usuario_id: string;
  cervezas: Array<{
    cerveza: string;
    cantidad: number;
  }>;
}
