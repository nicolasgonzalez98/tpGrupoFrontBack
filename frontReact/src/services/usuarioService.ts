import axios from 'axios';
import { API_URL } from './config';
import type { IUsuario } from '../models/usuario.models';

// Equivalente a frontEnd/src/services/UsuarioService.ts
const apiUrl = `${API_URL}/api/usuarios`;

export function getUsuarios(): Promise<IUsuario[]> {
  return axios.get<IUsuario[]>(apiUrl).then((r) => r.data);
}

export function updateUsuario(id: string, partialData: Partial<IUsuario>): Promise<IUsuario> {
  return axios.patch<IUsuario>(`${apiUrl}/${id}`, partialData).then((r) => r.data);
}

// Alta de empleado: usa el endpoint admin (POST /api/usuarios), que fija rol='empleado'
// en el backend. NO se usa /api/auth/register, que es público y solo crea clientes.
export function createEmpleado(data: { nombre: string; email: string; password: string }): Promise<IUsuario> {
  return axios.post<IUsuario>(apiUrl, data).then((r) => r.data);
}
