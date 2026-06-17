import { useState } from 'react';
import { Button } from 'primereact/button';
import { useAuth } from '../context/AuthContext';

/**
 * Equivalente a navbar.component (Angular). Menú por rol con submenús que se
 * abren al pasar el mouse. Los enlaces usan <a href> (igual que el original, que
 * usaba [href]="sub.path") → navegación con recarga completa.
 */
interface SubItem {
  label: string;
  path: string;
  visible: boolean;
}
interface MenuItem {
  label: string;
  visible: boolean;
  submenuKey: string;
  submenu: SubItem[];
}

export default function Navbar() {
  const { user, logout } = useAuth();

  const isAdmin = user?.rol === 'admin';
  const isEmployee = user?.rol === 'empleado';
  const isClient = user?.rol === 'cliente';

  const [showMenus, setShowMenus] = useState<Record<string, boolean>>({});

  const menuItems: MenuItem[] = [
    {
      label: 'Stock',
      visible: isAdmin || isEmployee,
      submenuKey: 'showStockMenu',
      submenu: [
        { label: 'Ver stock', path: '/stock', visible: isEmployee || isAdmin },
        { label: 'Agregar cerveza', path: '/stock/crearCerveza', visible: isEmployee || isAdmin },
        { label: 'Administrar pedidos', path: '/stock/administrar-pedidos', visible: isEmployee || isAdmin },
      ],
    },
    {
      label: 'Administrador',
      visible: isAdmin,
      submenuKey: 'showAdminMenu',
      submenu: [
        { label: 'Panel de admin', path: '/admin', visible: isAdmin },
        { label: 'Registrar empleado', path: '/admin/crear-empleado', visible: isAdmin },
      ],
    },
    {
      label: 'Pedidos',
      visible: isClient,
      submenuKey: 'showClientsMenu',
      submenu: [
        { label: 'Realizar pedido', path: '/pedidos', visible: isClient },
        { label: 'Ver mis pedidos', path: '/pedidos/mis-pedidos', visible: isClient },
      ],
    },
  ];

  return (
    <nav className="bg-gray-800">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          {/* Botón mobile (estático, igual que el original) */}
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            <button
              type="button"
              className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:ring-2 focus:ring-white focus:outline-hidden focus:ring-inset"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="absolute -inset-0.5"></span>
              <span className="sr-only">Open main menu</span>
              <svg className="block size-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          </div>

          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex shrink-0 items-center">
              <a href="/">
                <img className="h-8 w-auto" src="https://cdn-icons-png.flaticon.com/512/6541/6541764.png" alt="Cerveceria" />
              </a>
            </div>
            <div className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4">
                {menuItems.map(
                  (item) =>
                    item.visible && (
                      <div
                        key={item.submenuKey}
                        className="relative"
                        onMouseEnter={() => setShowMenus((m) => ({ ...m, [item.submenuKey]: true }))}
                        onMouseLeave={() => setShowMenus((m) => ({ ...m, [item.submenuKey]: false }))}
                      >
                        <button className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white">
                          {item.label}
                        </button>

                        {showMenus[item.submenuKey] && (
                          <div className="absolute left-0 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                            <div className="py-1">
                              {item.submenu.map(
                                (sub) =>
                                  sub.visible && (
                                    <a
                                      key={sub.path}
                                      href={sub.path}
                                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                    >
                                      {sub.label}
                                    </a>
                                  )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                )}
              </div>
            </div>
          </div>

          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            <Button icon="pi pi-sign-out" label="Cerrar sesión" onClick={() => logout()} />
          </div>
        </div>
      </div>
    </nav>
  );
}
