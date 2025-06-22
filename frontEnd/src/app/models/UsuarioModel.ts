export interface Usuario {
  _id: string; 
  nombre: string;
  email: string;
  password?: string; // Opcional en el frontend si no lo vas a manejar directamente
  rol: 'admin' | 'empleado' | 'cliente'; // Usamos uniones literales para los roles
  activo: boolean;
  createdAt?: string; // Mongoose añade estos campos automáticamente
  updatedAt?: string; // Mongoose añade estos campos automáticamente
}