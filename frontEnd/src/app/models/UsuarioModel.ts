export interface Usuario {
  _id: string; 
  nombre: string;
  email: string;
  password?: string;
  rol: 'admin' | 'empleado' | 'cliente';
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}