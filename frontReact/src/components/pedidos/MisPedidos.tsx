import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import * as pedidosService from '../../services/pedidosService';
import * as cervezaService from '../../services/cervezaService';
import type { IAdminPedido } from '../../models/adminPedido.models';
import type { ICerveza } from '../../models/cerveza.models';
import { formatFecha } from '../../utils/date';

/**
 * Equivalente a pedidos/mis-pedidos.component (Angular). Lista los pedidos del cliente.
 * Replica el patrón N+1 (un getCervezaById por ítem) y el bug window.location.href.
 */
export default function MisPedidos() {
  const { user } = useAuth();
  const toast = useToast();

  const [misPedidos, setMisPedidos] = useState<IAdminPedido[]>([]);
  const [cervezasPorPedido, setCervezasPorPedido] = useState<
    Record<string, Array<ICerveza & { cantidad: number }>>
  >({});

  useEffect(() => {
    if (!user || !user._id) {
      toast.show({ severity: 'error', summary: 'Error', detail: 'Usuario no autenticado' });
      window.location.href = '/login';
      return;
    }

    pedidosService
      .getPedidosByUsuario(user._id)
      .then((pedidos) => {
        setMisPedidos(pedidos);
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
      .catch(() => {
        toast.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los pedidos' });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <h2 className="mb-6 text-2xl font-bold text-center">Mis Pedidos</h2>
      {misPedidos && misPedidos.length > 0 ? (
        <div className="flex flex-wrap gap-8 justify-center">
          {misPedidos.map((pedido, i) => (
            <div
              key={pedido._id ?? i}
              className="bg-gray-800 text-gray-100 rounded-lg shadow-lg p-6 w-full sm:w-[350px] md:w-[400px] lg:w-[450px] mb-4 flex-shrink-0"
            >
              <div className="mb-2 text-gray-300 text-sm">
                Pedido ID: <span className="font-mono">{pedido._id}</span>
              </div>
              <div className="mb-2">
                <strong className="text-gray-300">Estado:</strong>
                {pedido.estado === 'pendiente' && <span className="text-yellow-400"> {pedido.estado}</span>}
                {pedido.estado === 'aprobado' && <span className="text-green-400"> {pedido.estado}</span>}
                {pedido.estado === 'rechazado' && <span className="text-red-400"> {pedido.estado}</span>}
              </div>
              <div className="mb-2 text-gray-300">
                <strong className="text-gray-300">Fecha:</strong> {formatFecha(pedido.fecha)}
              </div>
              {pedido.estado === 'pendiente' ? (
                <div className="mb-2 text-yellow-400">Tu pedido está pendiente de aprobación.</div>
              ) : pedido.estado === 'aprobado' ? (
                <>
                  <div className="mb-2 text-green-400">Tu pedido ha sido aprobado.</div>
                  <div className="mb-2">
                    <strong>Fecha aprobación:</strong> {formatFecha(pedido.fecha_aprobacion)}
                  </div>
                </>
              ) : pedido.estado === 'rechazado' ? (
                <div className="mb-2 text-red-400">Tu pedido ha sido rechazado.</div>
              ) : null}
              <div className="mb-2">
                <strong className="text-gray-300">Cervezas solicitadas:</strong>
                <ul className="ml-4 mt-2 flex flex-col gap-2">
                  {(cervezasPorPedido[pedido._id] ?? []).map((cerveza, j) => (
                    <li key={j} className="bg-gray-900 rounded px-3 py-2">
                      <div>
                        <span className="font-semibold text-gray-300">Nombre: </span>
                        <span className="font-bold text-gray-300">{cerveza.nombre}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-300">Tipo: </span>
                        <span className="font-bold text-gray-300">{cerveza.tipo}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-300">Cantidad: </span>
                        <span className="font-bold text-gray-300">{cerveza.cantidad}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400 mt-8">No tenés pedidos realizados.</p>
      )}
    </>
  );
}
