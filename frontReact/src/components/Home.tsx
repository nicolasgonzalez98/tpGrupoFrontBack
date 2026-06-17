import { useAuth } from '../context/AuthContext';

/**
 * Equivalente a home.component (Angular). Muestra secciones según el rol del usuario.
 * Enlaces con <a href> (recarga completa), igual que el original.
 */
const CARD_CLASS =
  'block p-6 rounded-lg border border-gray-200 shadow hover:shadow-lg hover:scale-105 hover:bg-gray-100 transition-transform duration-300 ease-in-out';

export default function Home() {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin';
  const isEmployee = user?.rol === 'empleado';
  const isClient = user?.rol === 'cliente';

  return (
    <div className="p-6 space-y-10">
      {/* Sección Admin */}
      {isAdmin && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Admin</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a href="/admin" className={CARD_CLASS}>
              <div className="flex items-center space-x-4">
                <i className="pi pi-cog text-3xl text-blue-600"></i>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Panel de Admin</h3>
                  <p className="text-sm text-gray-600">Gestionar configuraciones generales</p>
                </div>
              </div>
            </a>
          </div>
        </section>
      )}

      {/* Sección Stock */}
      {(isAdmin || isEmployee) && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Stock</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a href="/stock" className={CARD_CLASS}>
              <div className="flex items-center space-x-4">
                <i className="pi pi-box text-3xl text-green-600"></i>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Ver Stock</h3>
                  <p className="text-sm text-gray-600">Consultar cervezas disponibles</p>
                </div>
              </div>
            </a>

            <a href="/stock/administrar-pedidos" className={CARD_CLASS}>
              <div className="flex items-center space-x-4">
                <i className="pi pi-truck text-3xl text-green-600"></i>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Administrar Pedidos</h3>
                  <p className="text-sm text-gray-600">Ver y gestionar pedidos entrantes</p>
                </div>
              </div>
            </a>
          </div>
        </section>
      )}

      {/* Sección Pedidos */}
      {isClient && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Pedidos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a href="/pedidos" className={CARD_CLASS}>
              <div className="flex items-center space-x-4">
                <i className="pi pi-shopping-cart text-3xl text-yellow-600"></i>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Realizar Pedido</h3>
                  <p className="text-sm text-gray-600">Elegí tus productos y hacé tu pedido</p>
                </div>
              </div>
            </a>

            <a href="/pedidos/mis-pedidos" className={CARD_CLASS}>
              <div className="flex items-center space-x-4">
                <i className="pi pi-list text-3xl text-yellow-600"></i>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Ver Mis Pedidos</h3>
                  <p className="text-sm text-gray-600">Seguimiento y estado de tus pedidos</p>
                </div>
              </div>
            </a>
          </div>
        </section>
      )}
    </div>
  );
}
