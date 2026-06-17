import axios from 'axios';

/**
 * Configuración global de Axios.
 *
 * - Request: adjunta el JWT (Authorization: Bearer <token>) a toda petición.
 *   Antes el front guardaba el token pero NO lo enviaba; ahora el backend valida
 *   el token en cada endpoint, así que esto es obligatorio.
 * - Response: si el backend responde 401 (token ausente/expirado/ inválido),
 *   se limpia la sesión y se redirige al login.
 */

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
