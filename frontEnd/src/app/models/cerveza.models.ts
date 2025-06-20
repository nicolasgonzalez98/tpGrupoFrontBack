export interface ICerveza {
  _id?: string;
  nombre: string;
  tipo: string;
  stock_actual: number;
  stock_minimo: number;
  activo: boolean;
}