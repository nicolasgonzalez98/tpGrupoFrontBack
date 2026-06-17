import { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import * as usuarioService from '../services/usuarioService';
import { Rol } from '../models/usuario.models';
import type { IUsuario } from '../models/usuario.models';

/**
 * Equivalente a lista-usuarios.component (Angular). Tabla de usuarios con edición
 * (modal nombre/email), activar/desactivar y cambio de rol.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ListaUsuarios() {
  const [usuarios, setUsuarios] = useState<IUsuario[]>([]);

  const [displayEditModal, setDisplayEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IUsuario | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editNombreTouched, setEditNombreTouched] = useState(false);
  const [editEmailTouched, setEditEmailTouched] = useState(false);
  const [editErrorMessage, setEditErrorMessage] = useState('');

  // Rol seleccionado por fila (el <select> de Angular usaba [ngModel] one-way + leía el value al guardar).
  const [rolSel, setRolSel] = useState<Record<string, string>>({});

  const getUsuarios = () => {
    usuarioService
      .getUsuarios()
      .then((data) => {
        setUsuarios(data.map((u) => ({ ...u, activo: !!u.activo })));
      })
      .catch((err) => {
        console.error('Error al obtener usuarios en el frontend:', err);
      });
  };

  useEffect(() => {
    getUsuarios();
  }, []);

  const openEditModal = (usuario: IUsuario) => {
    setSelectedUser({ ...usuario });
    setEditNombre(usuario.nombre);
    setEditEmail(usuario.email);
    setEditNombreTouched(false);
    setEditEmailTouched(false);
    setEditErrorMessage('');
    setDisplayEditModal(true);
  };

  const closeEditModal = () => {
    setDisplayEditModal(false);
    setSelectedUser(null);
  };

  const nombreInvalid = editNombre.trim() === '';
  const emailInvalid = editEmail === '' || !EMAIL_PATTERN.test(editEmail);
  const formInvalid = nombreInvalid || emailInvalid;

  const saveUserChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formInvalid || !selectedUser) {
      setEditErrorMessage(
        'Por favor, completa todos los campos requeridos y asegúrate de que el email sea válido.'
      );
      return;
    }

    setEditErrorMessage('');
    const userId = selectedUser._id;
    if (!userId) {
      setEditErrorMessage(
        'No se pudo obtener el ID del usuario para guardar los cambios. Por favor, recargue la página.'
      );
      return;
    }

    const partialData: Partial<IUsuario> = { nombre: editNombre, email: editEmail };

    try {
      const usuarioActualizado = await usuarioService.updateUsuario(userId, partialData);
      if (usuarioActualizado) {
        setUsuarios((prev) =>
          prev.map((u) =>
            u._id === usuarioActualizado._id
              ? {
                  ...u,
                  nombre: usuarioActualizado.nombre,
                  email: usuarioActualizado.email,
                  activo: !!usuarioActualizado.activo,
                }
              : u
          )
        );
        closeEditModal();
      } else {
        setEditErrorMessage('Error: No se recibieron datos del usuario actualizado.');
      }
    } catch (error: any) {
      setEditErrorMessage(
        error?.response?.data?.message || error?.message || 'Error desconocido al actualizar usuario.'
      );
    }
  };

  const toggleActivo = async (usuario: IUsuario) => {
    if (!usuario._id) {
      alert('No se pudo cambiar el estado activo: ID de usuario no encontrado.');
      return;
    }
    const nuevoEstadoActivo = !usuario.activo;
    try {
      const updatedUser = await usuarioService.updateUsuario(usuario._id, { activo: nuevoEstadoActivo });
      if (updatedUser) {
        setUsuarios((prev) =>
          prev.map((u) => (u._id === updatedUser._id ? { ...u, activo: !!updatedUser.activo } : u))
        );
      } else {
        alert('Error: No se recibieron datos del usuario actualizado al cambiar estado.');
      }
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Error al actualizar estado.');
    }
  };

  const cambiarRol = async (usuario: IUsuario, nuevoRolString: string) => {
    const nuevoRol = nuevoRolString as Rol;
    if (usuario.rol === nuevoRol) {
      return;
    }
    if (!usuario._id) {
      alert('No se pudo cambiar el rol: ID de usuario no encontrado.');
      return;
    }
    try {
      const updatedUser = await usuarioService.updateUsuario(usuario._id, { rol: nuevoRol });
      if (updatedUser) {
        setUsuarios((prev) =>
          prev.map((u) => (u._id === updatedUser._id ? { ...u, rol: updatedUser.rol } : u))
        );
      } else {
        alert('Error: No se recibieron datos del usuario actualizado al cambiar rol.');
      }
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Error al actualizar rol.');
    }
  };

  const getRolSel = (u: IUsuario) => rolSel[u._id] ?? u.rol;

  return (
    <>
      <div className="p-6 bg-white shadow-md rounded-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Lista de Usuarios</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usuarios.map((usuario) => (
                <tr key={usuario._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{usuario.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{usuario.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{usuario.rol}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span
                      className={
                        usuario.activo
                          ? 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800'
                          : 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800'
                      }
                    >
                      {usuario.activo ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openEditModal(usuario)} className="text-indigo-600 hover:text-indigo-900 mr-2">
                      Editar
                    </button>

                    <button
                      className={`${usuario.activo ? 'bg-red-500 hover:bg-red-700' : 'bg-green-500 hover:bg-green-700'} text-white font-bold py-1 px-3 rounded text-xs transition duration-150 ease-in-out mr-2`}
                      onClick={() => toggleActivo(usuario)}
                    >
                      {usuario.activo ? 'Desactivar' : 'Activar'}
                    </button>

                    <div className="inline-flex items-center space-x-1">
                      <select
                        value={getRolSel(usuario)}
                        onChange={(e) => setRolSel((prev) => ({ ...prev, [usuario._id]: e.target.value }))}
                        className="block w-full py-1 px-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-xs"
                      >
                        <option value="admin">Admin</option>
                        <option value="empleado">Empleado</option>
                        <option value="cliente">Cliente</option>
                      </select>
                      <button
                        onClick={() => cambiarRol(usuario, getRolSel(usuario))}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs transition duration-150 ease-in-out"
                      >
                        Guardar Rol
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                    No hay usuarios para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        header="Editar Usuario"
        visible={displayEditModal}
        modal
        style={{ width: '50vw' }}
        draggable={false}
        resizable={false}
        onHide={closeEditModal}
      >
        <form onSubmit={saveUserChanges} className="p-fluid">
          <div className="p-field mb-4">
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <InputText
              id="nombre"
              type="text"
              value={editNombre}
              onChange={(e) => setEditNombre(e.target.value)}
              onBlur={() => setEditNombreTouched(true)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            {nombreInvalid && editNombreTouched && (
              <small className="text-red-600 text-xs mt-1 block">El nombre es requerido.</small>
            )}
          </div>
          <div className="p-field mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <InputText
              id="email"
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              onBlur={() => setEditEmailTouched(true)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            {emailInvalid && editEmailTouched && (
              <small className="text-red-600 text-xs mt-1 block">Por favor, ingresa un email válido.</small>
            )}
          </div>

          {editErrorMessage && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{editErrorMessage}</span>
            </div>
          )}

          <div className="p-dialog-footer flex justify-end gap-2 mt-4">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-text p-button-secondary"
              type="button"
              onClick={closeEditModal}
            />
            <Button label="Guardar Cambios" icon="pi pi-check" type="submit" className="p-button-primary" />
          </div>
        </form>
      </Dialog>
    </>
  );
}
