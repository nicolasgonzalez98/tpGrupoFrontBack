import { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { confirmDialog } from 'primereact/confirmdialog';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import * as pedidosService from '../../services/pedidosService';
import * as cervezaService from '../../services/cervezaService';
import type { IAdminPedido } from '../../models/adminPedido.models';
import type { ICerveza } from '../../models/cerveza.models';
import { formatFecha } from '../../utils/date';

/**
 * Equivalente a stock/administrar-pedidos.component (Angular). Vista de empleado/admin:
 * lista todos los pedidos y permite aceptar / rechazar / eliminar.
 * Replica el patrón N+1 (un getCervezaById por ítem) y el bug window.location.href.
 */
export default function AdministrarPedidos() {
  const { user } = useAuth();
  const toast = useToast();

  const [adminPedidos, setAdminPedidos] = useState<IAdminPedido[]>([]);
  const [cervezasPorPedido, setCervezasPorPedido] = useState<
    Record<string, Array<ICerveza & { cantidad: number }>>
  >({});

  const loadPedidos = () => {
    pedidosService
      .getAllPedidos()
      .then((pedidos) => {
        setAdminPedidos(pedidos);
        setCervezasPorPedido({});
        for (const pedido of pedidos) {
          setCervezasPorPedido((prev) => ({ ...prev, [pedido._id]: prev[pedido._id] ?? [] }));
          for (const item of pedido.cervezas) {
            cervezaService.getCervezaById(item.cerveza).then((cerveza) => {
              setCervezasPorPedido((prev) => ({
                ...prev,
                [pedido._id]: [...(prev[pedido._id] ?? []), { ...cerveza, cantidad: item.cantidad }],
              }));
            });
          }
        }
      })
      .catch((err) => {
        console.error('Error al cargar pedidos:', err);
        toast.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los pedidos' });
      });
  };

  useEffect(() => {
    loadPedidos();

    if (!user || !user._id) {
      toast.show({ severity: 'error', summary: 'Error', detail: 'Usuario no autenticado' });
      window.location.href = '/login';
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actualizarPedidoEnBackend = (pedido: IAdminPedido) => {
    const body = {
      estado: pedido.estado,
      aprobado_por: user!._id,
    };
    pedidosService
      .updatePedido(pedido._id, body)
      .then(() => {
        toast.show({ severity: 'success', summary: 'Éxito', detail: 'Pedido actualizado correctamente' });
        loadPedidos();
      })
      .catch((err) => {
        console.error('Error al actualizar el pedido:', err);
        toast.show({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el pedido' });
      });
  };

  const aceptarPedido = (pedido: IAdminPedido) => {
    actualizarPedidoEnBackend({ ...pedido, estado: 'aprobado', fecha_aprobacion: new Date() });
  };

  const rechazarPedido = (pedido: IAdminPedido) => {
    actualizarPedidoEnBackend({ ...pedido, estado: 'rechazado' });
  };

  const confirmarAceptacion = (pedido: IAdminPedido) => {
    confirmDialog({
      message: '¿Estás seguro de que deseas aceptar este pedido?',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      accept: () => aceptarPedido(pedido),
    });
  };

  const confirmarRechazo = (pedido: IAdminPedido) => {
    confirmDialog({
      message: '¿Estás seguro de que deseas rechazar este pedido?',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      accept: () => rechazarPedido(pedido),
    });
  };

  const eliminarPedido = (pedidoId: string) => {
    pedidosService
      .deletePedidoById(pedidoId)
      .then(() => {
        toast.show({ severity: 'success', summary: 'Eliminado', detail: 'Pedido eliminado correctamente' });
        loadPedidos();
      })
      .catch((err) => {
        console.error('Error al eliminar el pedido:', err);
        toast.show({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el pedido' });
      });
  };

  return (
    <>
      <h2 className="mb-6 text-2xl font-bold text-center">Administrar Pedidos</h2>
      {adminPedidos && adminPedidos.length > 0 ? (
        <>
          <p className="mb-4 text-lg text-center">
            Total de pedidos: <span className="font-semibold">{adminPedidos.length}</span>
          </p>
          <div className="flex flex-wrap gap-8 justify-center">
            {adminPedidos.map((pedido, i) => (
              <div
                key={pedido._id ?? i}
                className="bg-gray-800 rounded-lg shadow-lg p-6 w-full sm:w-[350px] md:w-[400px] lg:w-[450px] mb-4 flex-shrink-0 flex flex-col"
              >
                <div className="mb-2 text-gray-300 text-sm">
                  Pedido ID: <span className="font-mono">{pedido._id}</span>
                </div>
                <div className="mb-2">
                  <strong>Estado:</strong>
                  {pedido.estado === 'pendiente' && <span className="text-yellow-400"> {pedido.estado}</span>}
                  {pedido.estado === 'aprobado' && <span className="text-green-400"> {pedido.estado}</span>}
                  {pedido.estado === 'rechazado' && <span className="text-red-400"> {pedido.estado}</span>}
                </div>
                <div className="mb-2">
                  <strong>Fecha:</strong> {formatFecha(pedido.fecha)}
                </div>
                <div className="mb-2">
                  <strong>Pedido de:</strong> <span className="font-mono"> {pedido.usuario_id}</span>
                </div>
                <div className="mb-2">
                  <strong>Cervezas solicitadas:</strong>
                  <ul className="ml-4 mt-2 flex flex-col gap-2">
                    {(cervezasPorPedido[pedido._id] ?? []).map((cerveza, j) => (
                      <li key={j} className="bg-gray-900 rounded px-3 py-2">
                        <div>
                          <span className="font-semibold text-gray-300">Id: </span>
                          <span className="font-mono">{cerveza._id}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-300">Nombre: </span>
                          <span className="font-bold">{cerveza.nombre}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-300">Tipo: </span>
                          <span className="font-bold">{cerveza.tipo}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-300">Cantidad: </span>
                          <span className="font-bold">{cerveza.cantidad}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-auto pt-8 flex gap-4 justify-end items-center">
                  {pedido.estado === 'pendiente' && (
                    <>
                      <Button
                        label="Aceptar"
                        className="p-button p-button-success p-button-lg font-bold"
                        onClick={() => confirmarAceptacion(pedido)}
                      />
                      <Button
                        label="Rechazar"
                        className="p-button p-button-danger p-button-lg font-bold"
                        onClick={() => confirmarRechazo(pedido)}
                      />
                    </>
                  )}
                  {pedido.estado === 'aprobado' && (
                    <>
                      <span className="text-green-400 font-semibold flex items-center">
                        Estado del pedido: Aceptado
                      </span>
                      <Button
                        label="Rechazar"
                        className="p-button p-button-danger p-button-lg font-bold"
                        onClick={() => confirmarRechazo(pedido)}
                      />
                    </>
                  )}
                  {pedido.estado === 'rechazado' && (
                    <>
                      <span className="text-red-400 font-semibold flex items-center">
                        Estado del pedido: Rechazado
                      </span>
                      <Button
                        label="Aceptar"
                        className="p-button p-button-success p-button-lg font-bold"
                        onClick={() => confirmarAceptacion(pedido)}
                      />
                    </>
                  )}
                  <Button
                    label="Eliminar"
                    className="p-button p-button-secondary p-button-lg font-bold text-500 border-red-400 bg-gray-200"
                    onClick={() => eliminarPedido(pedido._id)}
                  />
                </div>
              </div>
            ))}
          </div>
          <hr className="my-8 border-gray-700" />
        </>
      ) : (
        <p className="text-center text-gray-400 mt-8">No hay pedidos para administrar.</p>
      )}
    </>
  );
}
