import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Equivalente a GuestGuard de Angular: si ya hay sesión, redirige a '/'.
 * Usado en /login y /register.
 */
export default function GuestRoute({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();

  if (isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
