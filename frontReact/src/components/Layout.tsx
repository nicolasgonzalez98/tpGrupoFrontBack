import { Outlet, useLocation } from 'react-router-dom';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { useAuth } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import Navbar from './Navbar';

/**
 * Equivalente a app.component + layout.component de Angular.
 *  - Navbar visible cuando hay sesión y la ruta no es /login ni /register.
 *  - <main> con el outlet + Toast (vía ToastProvider) + ConfirmDialog,
 *    réplica de layout.component.html (<p-toast> + <p-confirmDialog>).
 *
 * El ToastProvider y el <ConfirmDialog> viven acá (siempre montados, igual que en
 * el layout Angular) para que cualquier página hija pueda disparar toasts/confirmaciones.
 */
export default function Layout() {
  const { isLoggedIn } = useAuth();
  const location = useLocation();
  const showNavbar = !['/login', '/register'].includes(location.pathname);

  return (
    <ToastProvider>
      {showNavbar && isLoggedIn && <Navbar />}
      <main className="p-4">
        <Outlet />
        <ConfirmDialog />
      </main>
    </ToastProvider>
  );
}
