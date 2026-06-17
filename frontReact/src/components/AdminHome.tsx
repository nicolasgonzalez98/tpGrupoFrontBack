import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Dialog } from 'primereact/dialog';

/**
 * Equivalente a admin.component / AdminHomeComponent (Angular).
 * Panel de administración con accesos a gestión de usuarios y alta de empleado.
 * Si llega con ?registrado=true muestra el diálogo y limpia el query param.
 */
const CARD_CLASS =
  'block p-6 rounded-lg border border-gray-200 shadow hover:shadow-lg hover:scale-105 hover:bg-gray-100 transition-transform duration-300 ease-in-out';

export default function AdminHome() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showRegisteredDialog, setShowRegisteredDialog] = useState(false);

  useEffect(() => {
    if (searchParams.get('registrado') === 'true') {
      setShowRegisteredDialog(true);
      searchParams.delete('registrado');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Panel de Administración</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card: Gestionar Usuarios */}
          <a href="/admin/usuarios" className={CARD_CLASS}>
            <div className="flex items-center space-x-4">
              <i className="pi pi-users text-3xl text-blue-600"></i>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Gestionar Usuarios</h3>
                <p className="text-sm text-gray-600">Ver, editar o eliminar cuentas existentes</p>
              </div>
            </div>
          </a>

          {/* Card: Registrar Usuario */}
          <a href="/admin/crear-empleado" className={CARD_CLASS}>
            <div className="flex items-center space-x-4">
              <i className="pi pi-user-plus text-3xl text-green-600"></i>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Registrar Usuario</h3>
                <p className="text-sm text-gray-600">Crear una nueva cuenta de empleado</p>
              </div>
            </div>
          </a>
        </div>
      </section>

      <Dialog
        header="¡Registro exitoso!"
        visible={showRegisteredDialog}
        modal
        dismissableMask
        onHide={() => setShowRegisteredDialog(false)}
        style={{ width: '300px' }}
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <i className="pi pi-check-circle text-green-500 text-5xl"></i>
          <p className="text-lg">El empleado fue registrado correctamente.</p>
          <p className="text-sm text-gray-600">Ahora puede iniciar sesión.</p>
        </div>
      </Dialog>
    </>
  );
}
