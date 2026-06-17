import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authService from '../services/authService';
import type { LoginResponse } from '../services/authService';
import type { IUsuario } from '../models/usuario.models';

/**
 * Reemplaza el estado reactivo de la AuthService de Angular (los BehaviorSubject
 * isLoggedIn$ y user$) por React Context. La lógica de datos (axios) y los helpers
 * de localStorage viven en services/authService.ts; acá se orquesta el estado.
 */

interface AuthContextValue {
  user: IUsuario | null;
  isLoggedIn: boolean;
  login: (data: { email: string; password: string }) => Promise<LoginResponse>;
  register: (data: unknown) => Promise<unknown>;
  logout: () => void;
  getUser: () => IUsuario | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  // Estado inicial leído de localStorage (igual que los BehaviorSubject de Angular,
  // que se inicializaban con isLoggedIn() y getUserFromStorage()).
  const [user, setUser] = useState<IUsuario | null>(() => authService.getUserFromStorage());
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => authService.isLoggedIn());

  const login = useCallback(async (data: { email: string; password: string }) => {
    const res = await authService.login(data);
    authService.saveSession(res.token, res.user);
    setUser(res.user);
    setIsLoggedIn(true);
    return res;
  }, []);

  const register = useCallback((data: unknown) => authService.register(data), []);

  const logout = useCallback(() => {
    authService.clearSession();
    setUser(null);
    setIsLoggedIn(false);
    navigate('/login');
  }, [navigate]);

  const getUser = useCallback(() => user, [user]);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, register, logout, getUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return ctx;
}
