import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  roles?: string[];
  children: ReactNode;
}

/**
 * Combina AuthGuard + RoleGuard/AdminGuard/EmpleadoGuard/ClienteGuard de Angular.
 * En las rutas Angular el AuthGuard corre primero y luego el guard de rol, así que:
 *  - sin sesión            -> /login   (AuthGuard)
 *  - con sesión, rol no permitido -> /  (Role/Admin/Empleado/ClienteGuard)
 *
 * Para rutas que en Angular sólo tenían [AuthGuard] (ej. Home), se usa sin `roles`.
 */
export default function ProtectedRoute({ roles, children }: ProtectedRouteProps) {
  const { isLoggedIn, user } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (roles && (!user || !roles.includes(user.rol))) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
