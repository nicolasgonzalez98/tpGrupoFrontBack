import axios from 'axios';
import { API_URL } from './config';
import type { IPedido } from '../models/pedido.models';
import type { IAdminPedido } from '../models/adminPedido.models';

// Equivalente a frontEnd/src/services/pedidos.service.ts
const url = `${API_URL}/pedido`;

// --- Admin ---
export function getAllPedidos(): Promise<IAdminPedido[]> {
  return axios.get<IAdminPedido[]>(`${url}`).then((r) => r.data);
}

export function getAdminPedidoById(pedidoId: string): Promise<IAdminPedido> {
  return axios.get<IAdminPedido>(`${url}/${pedidoId}`).then((r) => r.data);
}

export function deletePedidoById(pedidoId: string): Promise<void> {
  return axios.delete<void>(`${url}/${pedidoId}`).then((r) => r.data);
}

export function updatePedido(
  pedidoId: string,
  data: { aprobado_por?: string; estado?: string }
): Promise<IPedido> {
  return axios.patch<IPedido>(`${url}/${pedidoId}`, data).then((r) => r.data);
}

// --- Cliente ---
export function createPedido(pedido: IPedido): Promise<IPedido> {
  return axios.post<IPedido>(`${url}`, pedido).then((r) => r.data);
}

export function getPedidoById(pedidoId: string): Promise<IPedido> {
  return axios.get<IPedido>(`${url}/${pedidoId}`).then((r) => r.data);
}

export function getPedidosByUsuario(usuarioId: string): Promise<IAdminPedido[]> {
  return axios.get<IAdminPedido[]>(`${url}/usuario/${usuarioId}`).then((r) => r.data);
}
