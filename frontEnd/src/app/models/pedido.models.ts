export interface IPedido {
  usuario_id: string;
  cervezas: Array<{
    cerveza: string;
    cantidad: number;
  }>;
}