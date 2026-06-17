import ListaUsuarios from './ListaUsuarios';

/**
 * Equivalente a admin-dashboard.component (Angular). Contenedor del listado de usuarios.
 */
export default function AdminDashboard() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Panel de Administración</h1>
      <p>Bienvenido al dashboard de administración.</p>

      <ListaUsuarios />
    </div>
  );
}
