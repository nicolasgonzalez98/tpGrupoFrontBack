import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import * as cervezaService from '../../services/cervezaService';
import type { ICerveza } from '../../models/cerveza.models';

/**
 * Equivalente a stock/cerveza-form.component (Angular).
 * Sirve para crear (/stock/crearCerveza) y editar (/stock/editarCerveza/:id).
 * Al guardar navega a /stock con ?creado=true o ?editado=true.
 */
export default function CervezaForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [cerveza, setCerveza] = useState<ICerveza>({
    nombre: '',
    tipo: '',
    stock_actual: 0,
    stock_minimo: 0,
    activo: true,
  });
  const [error, setError] = useState('');
  const [erroresForm, setErroresForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      cervezaService
        .getCervezaById(id)
        .then((data) => setCerveza(data))
        .catch(() => {
          setError('No se pudo cargar la cerveza.');
          console.error('Error cargando cerveza');
        });
    }
  }, [id]);

  const validar = (): boolean => {
    const errs: Record<string, string> = {};
    const { nombre, tipo, stock_actual, stock_minimo } = cerveza;

    if (!nombre.trim()) {
      errs['nombre'] = 'El nombre es obligatorio.';
    }
    if (!tipo.trim()) {
      errs['tipo'] = 'El tipo es obligatorio.';
    }
    if (stock_actual < 0) {
      errs['stock_actual'] = 'El stock actual no puede ser negativo.';
    }
    if (stock_minimo < 0) {
      errs['stock_minimo'] = 'El stock mínimo no puede ser negativo.';
    }

    setErroresForm(errs);
    setError('');
    return Object.keys(errs).length === 0;
  };

  const guardar = () => {
    if (!validar()) return;

    if (id) {
      cervezaService
        .updateCerveza(id, cerveza)
        .then(() => navigate('/stock?editado=true'))
        .catch(() => setError('Error actualizando la cerveza.'));
    } else {
      cervezaService
        .createCerveza(cerveza)
        .then(() => navigate('/stock?creado=true'))
        .catch(() => setError('Error creando la cerveza.'));
    }
  };

  const cancelar = () => navigate('/stock');

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-xl font-semibold mb-4">{id ? 'Editar Cerveza' : 'Nueva Cerveza'}</h2>

      <div className="mb-3">
        <label htmlFor="nombre" className="block mb-1 font-medium">
          Nombre
        </label>
        <InputText
          id="nombre"
          type="text"
          value={cerveza.nombre}
          onChange={(e) => setCerveza({ ...cerveza, nombre: e.target.value })}
        />
        {erroresForm['nombre'] && <div className="text-red-600 text-sm">{erroresForm['nombre']}</div>}
      </div>

      <div className="mb-3">
        <label htmlFor="tipo" className="block mb-1 font-medium">
          Tipo
        </label>
        <InputText
          id="tipo"
          type="text"
          value={cerveza.tipo}
          onChange={(e) => setCerveza({ ...cerveza, tipo: e.target.value })}
        />
        {erroresForm['tipo'] && <div className="text-red-600 text-sm">{erroresForm['tipo']}</div>}
      </div>

      <div className="mb-3">
        <label htmlFor="stock_actual" className="block mb-1 font-medium">
          Stock Actual
        </label>
        <InputNumber
          inputId="stock_actual"
          value={cerveza.stock_actual}
          min={0}
          onValueChange={(e) => setCerveza({ ...cerveza, stock_actual: e.value ?? 0 })}
        />
        {erroresForm['stock_actual'] && (
          <div className="text-red-600 text-sm">{erroresForm['stock_actual']}</div>
        )}
      </div>

      <div className="mb-3">
        <label htmlFor="stock_minimo" className="block mb-1 font-medium">
          Stock Mínimo
        </label>
        <InputNumber
          inputId="stock_minimo"
          value={cerveza.stock_minimo}
          min={0}
          onValueChange={(e) => setCerveza({ ...cerveza, stock_minimo: e.value ?? 0 })}
        />
        {erroresForm['stock_minimo'] && (
          <div className="text-red-600 text-sm">{erroresForm['stock_minimo']}</div>
        )}
      </div>

      <div className="mb-3 flex items-center">
        <Checkbox
          inputId="activo"
          checked={cerveza.activo}
          onChange={(e) => setCerveza({ ...cerveza, activo: e.checked ?? false })}
        />
        <label htmlFor="activo" className="ml-2">
          Activo
        </label>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      <div className="flex justify-between mt-6">
        <Button label="Guardar" className="p-button-success" onClick={guardar} />
        <Button label="Cancelar" className="p-button-secondary" onClick={cancelar} />
      </div>
    </div>
  );
}
