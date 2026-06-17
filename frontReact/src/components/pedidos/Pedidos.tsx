import { useEffect, useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Sidebar } from 'primereact/sidebar';
import { confirmDialog } from 'primereact/confirmdialog';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import * as cervezaService from '../../services/cervezaService';
import * as pedidosService from '../../services/pedidosService';
import type { ICerveza } from '../../models/cerveza.models';
import type { IPedido } from '../../models/pedido.models';

/**
 * Equivalente a pedidos.component (Angular). Vista del cliente: catálogo de cervezas
 * y carrito (Sidebar/drawer). Replica el bug original: si no hay usuario autenticado
 * usa window.location.href = '/login' en vez del router.
 */
export default function Pedidos() {
  const { user } = useAuth();
  const toast = useToast();

  const [cervezas, setCervezas] = useState<ICerveza[]>([]);
  const [carrito, setCarrito] = useState<Array<{ cerveza: string; cantidad: number }>>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    cervezaService
      .getAllCervezas()
      .then((data) => {
        setCervezas(data);
        console.log('Cervezas activas:', data);
      })
      .catch((err) => {
        console.error('Error al cargar cervezas:', err);
        toast.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las cervezas' });
      });

    if (!user || !user._id) {
      toast.show({ severity: 'error', summary: 'Error', detail: 'Usuario no autenticado' });
      window.location.href = '/login';
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const agregarCervezaPedido = (cervezaID: string) => {
    const yaEnCarrito = carrito.some((c) => c.cerveza === cervezaID);
    if (yaEnCarrito) {
      toast.show({ severity: 'warn', summary: 'Atención', detail: 'Cerveza ya sumada' });
      return;
    }
    setCarrito((prev) => [...prev, { cerveza: cervezaID, cantidad: 1 }]);
  };

  const cambiarCantidadCerveza = (cervezaID: string, nuevaCantidad: number) => {
    if (nuevaCantidad > 0) {
      setCarrito((prev) =>
        prev.map((c) => (c.cerveza === cervezaID ? { ...c, cantidad: nuevaCantidad } : c))
      );
    }
  };

  const eliminarCervezaPedido = (cervezaid: string) => {
    confirmDialog({
      message: '¿Está seguro que desea eliminar la cerveza?',
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      accept: () => {
        setCarrito((prev) => prev.filter((c) => c.cerveza !== cervezaid));
        toast.show({ severity: 'success', summary: 'Eliminado', detail: 'Cerveza eliminada del pedido' });
      },
    });
  };

  const createPedido = () => {
    if (!user?._id) return;
    const pedido: IPedido = { usuario_id: user._id, cervezas: carrito };
    pedidosService
      .createPedido(pedido)
      .then(() => {
        toast.show({ severity: 'success', summary: 'Pedido Creado', detail: 'Pedido creado' });
        setCarrito([]);
      })
      .catch((err) => {
        console.error('Error al crear el pedido:', err);
        toast.show({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el pedido' });
      });
  };

  const pedidoCervezasDetallado = carrito.map((item) => {
    const cerveza = cervezas.find((c) => c._id === item.cerveza);
    return {
      ...item,
      nombre: cerveza?.nombre || 'Desconocida',
      tipo: cerveza?.tipo || 'Desconocido',
    };
  });

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1 flex justify-center">
          <h1 className="text-3xl font-bold text-center">Tienda Cerveza</h1>
        </div>
        <div>
          <Button onClick={() => setVisible(true)} icon="pi pi-shopping-cart" className="text-2xl" rounded />
        </div>
      </div>

      <div className="flex flex-wrap gap-6 justify-center">
        {cervezas.map(
          (cerveza, i) =>
            cerveza._id && (
              <Card
                key={cerveza._id ?? i}
                title={cerveza.nombre}
                subTitle={cerveza.tipo}
                className="mb-6 p-shadow-4 w-80"
              >
                <div>
                  <strong>Stock actual:</strong> {cerveza.stock_actual}
                </div>
                {cerveza.stock_actual > cerveza.stock_minimo ? (
                  <button
                    className="p-button p-component mt-2 w-full"
                    onClick={() => cerveza._id && agregarCervezaPedido(cerveza._id)}
                  >
                    <span className="p-button-label">Agregar al carrito</span>
                  </button>
                ) : (
                  <div className="text-red-500 mt-2">Sin Stock</div>
                )}
              </Card>
            )
        )}
      </div>

      <Sidebar
        header="Carrito"
        visible={visible}
        position="right"
        onHide={() => setVisible(false)}
        className="w-full md:w-80 lg:w-[30rem]"
      >
        {carrito.length > 0 ? (
          <>
            <div className="flex flex-col mb-6">
              <h2 className="text-lg font-semibold mb-4">Carrito de Pedidos</h2>
              {pedidoCervezasDetallado.map((item, i) => (
                <div key={item.cerveza ?? i} className="mb-5 border-b pb-4">
                  <div className="font-bold text-lg mb-1">{item.nombre}</div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Tipo: {item.tipo}</span>
                    <Button
                      icon="pi pi-trash"
                      className="p-button-danger p-button-sm"
                      label="Quitar"
                      onClick={() => eliminarCervezaPedido(item.cerveza)}
                    />
                  </div>
                  <div className="mb-1">Cantidad:</div>
                  <div className="flex items-center gap-3">
                    <Button
                      icon="pi pi-minus"
                      onClick={() => cambiarCantidadCerveza(item.cerveza, Math.max(1, item.cantidad - 1))}
                    />
                    <span className="px-3">{item.cantidad}</span>
                    <Button
                      icon="pi pi-plus"
                      onClick={() => cambiarCantidadCerveza(item.cerveza, item.cantidad + 1)}
                    />
                  </div>
                </div>
              ))}
            </div>
            <Button label="Confirmar pedido" className="w-full mt-3" onClick={createPedido} />
          </>
        ) : (
          <div className="text-center text-gray-500 mt-5">No hay cervezas en el carrito.</div>
        )}
      </Sidebar>
    </>
  );
}
