import axios from 'axios';
import { API_URL } from './config';
import type { IUsuario } from '../models/usuario.models';

// Equivalente a frontEnd/src/services/authService.ts (la parte de datos + sesión).
// El estado reactivo (isLoggedIn$ / user$ con BehaviorSubject) se reemplaza por
// AuthContext en el paso siguiente; este módulo expone las llamadas a la API y
// los helpers de localStorage.

const apiUrl = `${API_URL}/api/auth`;

export interface LoginResponse {
  message: string;
  token: string;
  user: IUsuario;
}

export async function register(data: unknown): Promise<unknown> {
  try {
    const response = await axios.post(`${apiUrl}/register`, data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: 'Error de red o desconocido' };
  }
}

export async function login(data: { email: string; password: string }): Promise<LoginResponse> {
  try {
    const response = await axios.post<LoginResponse>(`${apiUrl}/login`, data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: 'Error de red o desconocido' };
  }
}

// --- Helpers de sesión (localStorage), 1:1 con la AuthService de Angular ---

export function isLoggedIn(): boolean {
  const token = localStorage.getItem('token');
  return token !== null && token !== '';
}

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function getUserFromStorage(): IUsuario | null {
  const user = localStorage.getItem('user');
  return user ? (JSON.parse(user) as IUsuario) : null;
}

export function saveSession(token: string, user: IUsuario): void {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
