import axios from 'axios';
import { API_URL } from './config';
import type { ICerveza } from '../models/cerveza.models';

// Equivalente a frontEnd/src/services/cerveza.service.ts
// Mantiene la mezcla de rutas del original: GET en '/' y '/:id', CRUD en '/stock'.
const url = API_URL;

export function getAllCervezas(): Promise<ICerveza[]> {
  return axios.get<ICerveza[]>(`${url}`).then((r) => r.data);
}

export function getCervezaById(id: string): Promise<ICerveza> {
  return axios.get<ICerveza>(`${url}/${id}`).then((r) => r.data);
}

export function createCerveza(cerveza: ICerveza): Promise<ICerveza> {
  return axios.post<ICerveza>(`${url}/stock`, cerveza).then((r) => r.data);
}

export function updateCerveza(id: string, updateData: Partial<ICerveza>): Promise<ICerveza> {
  return axios.patch<ICerveza>(`${url}/stock/${id}`, updateData).then((r) => r.data);
}

export function deleteCervezaById(id: string): Promise<ICerveza> {
  return axios.delete<ICerveza>(`${url}/stock/${id}`).then((r) => r.data);
}
