import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { confirmDialog } from 'primereact/confirmdialog';
import * as cervezaService from '../../services/cervezaService';
import type { ICerveza } from '../../models/cerveza.models';

/**
 * Equivalente a stock/cervezas.component (Angular). Listado de cervezas con
 * tabla, alta (navega al form), edición y borrado (confirmDialog + recarga).
 * Diálogo de éxito disparado por ?creado / ?editado (que setea CervezaForm al guardar).
 */
export default function Cervezas() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [cervezas, setCervezas] = useState<ICerveza[]>([]);
  const [error, setError] = useState('');
  const [showCreatedDialog, setShowCreatedDialog] = useState(false);
  const [showEditedDialog, setShowEditedDialog] = useState(false);

  const getAllCervezas = () => {
    cervezaService
      .getAllCervezas()
      .then((data) => {
        setCervezas(data);
        setError('');
      })
      .catch(() => {
        setError('No se pudieron cargar las cervezas. Verificá la conexión con el servidor.');
      });
  };

  useEffect(() => {
    getAllCervezas();

    if (searchParams.get('creado')) {
      setShowCreatedDialog(true);
    } else if (searchParams.get('editado')) {
      setShowEditedDialog(true);
    }
    if (searchParams.has('creado') || searchParams.has('editado')) {
      searchParams.delete('creado');
      searchParams.delete('editado');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deleteCerveza = (id: string) => {
    cervezaService
      .deleteCervezaById(id)
      .then(() => getAllCervezas())
      .catch(() => setError('Error al eliminar cerveza'));
  };

  const eliminar = (cerveza: ICerveza) => {
    confirmDialog({
      message: `¿Estás seguro de que querés eliminar la cerveza "${cerveza.nombre}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      acceptClassName: 'p-button-danger',
      accept: () => {
        if (cerveza._id) {
          deleteCerveza(cerveza._id);
        }
      },
    });
  };

  const showDialog = showCreatedDialog || showEditedDialog;
  const hideDialog = () => {
    setShowCreatedDialog(false);
    setShowEditedDialog(false);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Listado de Cervezas</h2>
        <Button
          type="button"
          label="Agregar Cerveza"
          className="p-button-success"
          icon="pi pi-plus"
          onClick={() => navigate('/stock/crearCerveza')}
        />
      </div>

      <DataTable value={cervezas} responsiveLayout="scroll" className="shadow-md rounded-md">
        <Column field="nombre" header="Nombre" />
        <Column field="tipo" header="Tipo" />
        <Column field="stock_actual" header="Stock Actual" />
        <Column field="stock_minimo" header="Stock Mínimo" />
        <Column
          header="Activo"
          body={(row: ICerveza) => (
            <span className={row.activo ? 'text-green-600' : 'text-red-600'}>
              {row.activo ? 'Sí' : 'No'}
            </span>
          )}
        />
        <Column
          header="Acciones"
          body={(row: ICerveza) => (
            <>
              <Button
                label="Editar"
                className="p-button-rounded p-button-text p-button-sm mr-2"
                icon="pi pi-pencil"
                onClick={() => navigate(`/stock/editarCerveza/${row._id}`)}
              />
              <Button
                label="Eliminar"
                className="p-button-sm p-button-rounded p-button-danger"
                icon="pi pi-trash"
                onClick={() => eliminar(row)}
              />
            </>
          )}
        />
      </DataTable>

      {error && (
        <div className="p-4 mt-2 mb-4 bg-red-100 border border-red-300 text-red-800 rounded-md">
          {error}
        </div>
      )}

      <Dialog
        header="¡Exito!"
        visible={showDialog}
        modal
        dismissableMask
        onHide={hideDialog}
        style={{ width: '300px' }}
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <i className="pi pi-check-circle text-green-500 text-5xl"></i>
          <p className="text-lg">
            {showCreatedDialog
              ? 'La cerveza fue creada correctamente.'
              : 'La cerveza fue editada correctamente.'}
          </p>
          <p className="text-sm text-gray-600">
            {showCreatedDialog
              ? 'Ahora aparece en la lista de stock.'
              : 'Los cambios fueron guardados exitosamente.'}
          </p>
        </div>
      </Dialog>
    </div>
  );
}
