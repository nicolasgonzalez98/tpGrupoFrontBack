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
