export interface ICerveza {
  _id?: string;              // MongoDB genera este campo automáticamente
  nombre: string;
  tipo: string;
  stock_actual: number;
  stock_minimo: number;
  activo: boolean;
}