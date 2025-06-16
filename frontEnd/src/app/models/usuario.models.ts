

export interface IUsuario {
  id: string;       
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
}

export enum Rol{
    Admin = "admin",
    Empleado = "empleado",
    Cliente = "cliente"
}