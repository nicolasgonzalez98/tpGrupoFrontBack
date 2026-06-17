import { Routes, Route, Navigate } from 'react-router-dom';

import Layout from './components/Layout';
import ProtectedRoute from './guards/ProtectedRoute';
import GuestRoute from './guards/GuestRoute';

import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import AdminHome from './components/AdminHome';
import AdminDashboard from './components/AdminDashboard';
import Cervezas from './components/stock/Cervezas';
import CervezaForm from './components/stock/CervezaForm';
import AdministrarPedidos from './components/stock/AdministrarPedidos';
import Pedidos from './components/pedidos/Pedidos';
import MisPedidos from './components/pedidos/MisPedidos';

/**
 * Árbol de rutas equivalente a frontEnd/src/app/app.routes.ts.
 *
 * Mapeo de guards:
 *  - [AuthGuard]                       -> <ProtectedRoute>
 *  - [AuthGuard, RoleGuard roles:[…]]  -> <ProtectedRoute roles={[…]}>
 *  - [AuthGuard, AdminGuard]           -> <ProtectedRoute roles={['admin']}>
 *  - [AuthGuard, ClienteGuard]         -> <ProtectedRoute roles={['cliente']}>
 *  - [GuestGuard]                      -> <GuestRoute>
 *  - '**' redirectTo:''                -> <Route path="*" Navigate to="/">
 */
export default function App() {
  const ROLES_STOCK = ['admin', 'empleado'];

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<ProtectedRoute><Home /></ProtectedRoute>} />

        <Route path="register" element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="login" element={<GuestRoute><Login /></GuestRoute>} />

        <Route path="stock" element={<ProtectedRoute roles={ROLES_STOCK}><Cervezas /></ProtectedRoute>} />
        <Route path="stock/editarCerveza/:id" element={<ProtectedRoute roles={ROLES_STOCK}><CervezaForm /></ProtectedRoute>} />
        <Route path="stock/crearCerveza" element={<ProtectedRoute roles={ROLES_STOCK}><CervezaForm /></ProtectedRoute>} />
        <Route path="stock/administrar-pedidos" element={<ProtectedRoute roles={ROLES_STOCK}><AdministrarPedidos /></ProtectedRoute>} />

        <Route path="admin" element={<ProtectedRoute roles={['admin']}><AdminHome /></ProtectedRoute>} />
        <Route path="admin/usuarios" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="admin/crear-empleado" element={<ProtectedRoute roles={['admin']}><Register /></ProtectedRoute>} />

        <Route path="pedidos" element={<ProtectedRoute roles={['cliente']}><Pedidos /></ProtectedRoute>} />
        <Route path="pedidos/mis-pedidos" element={<ProtectedRoute roles={['cliente']}><MisPedidos /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
