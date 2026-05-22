# Módulo: `pedidoService.js`

Análisis técnico en profundidad del service que gestiona el ciclo de vida de los pedidos.

- **Archivo:** [`backEnd/services/pedidoService.js`](../../backEnd/services/pedidoService.js)
- **Capa:** Service (lógica de negocio)
- **Dependencias directas:** `pedidoRepository`, `cervezaRepository`

> Este documento complementa la vista general de [ARCHITECTURE.md](ARCHITECTURE.md) y las reglas en [BUSINESS_RULES.md](../business/BUSINESS_RULES.md), zoom-in al único service del backend que coordina dos agregados (`Pedido` + `Cerveza`).

---

## 1. Responsabilidades

Capa de **lógica de negocio de pedidos** dentro del flujo:

```
route → controller → SERVICE  ← este módulo →  repository → mongoose
```

Concretamente:
- Orquesta el **ciclo de vida** del pedido: crear, listar, leer, listar por usuario, actualizar, borrar.
- Es el **único service del backend que coordina dos agregados**: `Pedido` y `Cerveza`. El resto de los services hablan con un solo repository; este habla con dos.
- Aplica reglas que no son responsabilidad del controller (HTTP) ni del repository (acceso a datos):
  - Validar existencia de cada cerveza referenciada.
  - Validar stock suficiente.
  - Componer la operación "descontar stock + crear pedido".

---

## 2. Dependencias

```js
const pedidoRepository = require('../repository/pedidoRepository');
const cervezaRepository = require('../repository/cervezaRepository');
```

| Dependencia | Uso |
|---|---|
| [`pedidoRepository`](../../backEnd/repository/pedidoRepository.js) | CRUD del documento `Pedido` |
| [`cervezaRepository`](../../backEnd/repository/cervezaRepository.js) | `getCervezaById`, `descontarStockActualById` |

**No depende de** (y debería):
- `userRepository` — no valida que `usuario_id` exista ni que esté `activo`.
- Un logger configurable — usa `console.*` indirectamente vía controllers.
- Un clock inyectable — `new Date()` se llama directo en el repository.

---

## 3. Funciones expuestas

| Función | Tipo | Responsabilidad |
|---|---|---|
| `createPedido(pedidoData)` | composición | Valida stock + descuenta + persiste |
| `getAllPedidos()` | pass-through | Lista todos los pedidos |
| `getPedidoById(id)` | pass-through | Lee un pedido por ID |
| `getPedidosByUsuario(usuarioId)` | pass-through | Lista pedidos de un usuario |
| `deletePedidoById(id)` | pass-through | Borrado físico |
| `updatePedido(id, {aprobado_por, estado})` | pass-through | Cambia estado y/o `aprobado_por` |

### 3.1 `createPedido` — la función con lógica real

```js
const createPedido = async (pedidoData) => {
    for (const item of pedidoData.cervezas) {                              // [A]
        const cerveza = await cervezaRepository.getCervezaById(item.cerveza);
        if (!cerveza) {
            throw new Error(`Cerveza con ID ${item.cerveza} no encontrada`);
        }
        if (cerveza.stock_actual < item.cantidad) {
            throw new Error(`Stock insuficiente para ${cerveza.nombre || 'la cerveza seleccionada'}`);
        }
    }

    for (const item of pedidoData.cervezas) {                              // [B]
        await cervezaRepository.descontarStockActualById(item.cerveza, item.cantidad);
    }

    const pedido = await pedidoRepository.createPedido(pedidoData);        // [C]
    return pedido;
};
```

Tres fases secuenciales:

- **[A] Validación** — recorre cada ítem, lo trae de Mongo (`getCervezaById`), verifica existencia y `stock_actual >= cantidad`.
- **[B] Descuento** — recorre nuevamente y descuenta `cantidad` del `stock_actual` (vía `$inc: -cantidad` en el repository).
- **[C] Persistencia** — crea el documento `Pedido` con `estado: 'pendiente'` (el estado lo agrega el controller antes de invocar).

**No es atómico.** Cada `await` es una operación independiente contra Mongo.

### 3.2 Resto de funciones

Todas son **pass-through** (delegan al repository sin lógica adicional). Detalles:

- **`getAllPedidos`** — sin paginación, sin `populate` → devuelve IDs sueltos.
- **`getPedidoById`** — usa `findOne({_id: id})`, sin `populate`.
- **`getPedidosByUsuario`** — filtra por `usuario_id`, sin `populate`.
- **`deletePedidoById`** — `findByIdAndDelete`, **sin restituir stock**.
- **`updatePedido`** — la regla "si `estado === 'aprobado'` setear `fecha_aprobacion`" vive en el repository ([`pedidoRepository.js:34`](../../backEnd/repository/pedidoRepository.js#L34)), no en el service.

---

## 4. Endpoints que lo consumen

Definidos en [`backEnd/routes/pedidoRoutes.js`](../../backEnd/routes/pedidoRoutes.js):

| Método | Ruta | Function | Rol esperado |
|---|---|---|---|
| `POST` | `/pedido/` | `createPedido` | cliente |
| `GET` | `/pedido/` | `getAllPedidos` | empleado / admin |
| `GET` | `/pedido/:id` | `getPedidoById` | empleado / admin |
| `GET` | `/pedido/usuario/:usuarioId` | `getPedidosByUsuario` | cliente (los propios) |
| `DELETE` | `/pedido/:id` | `deletePedidoById` | empleado / admin |
| `PATCH` | `/pedido/:id` | `updatePedido` | empleado / admin |

> ⚠️ Hoy **ninguna ruta está autenticada**. La autorización vive solo en los guards del frontend. Cualquier cliente HTTP (Postman, curl) puede saltar esa capa.

---

## 5. Reglas de negocio que aplica

### Reglas implementadas

1. **Cada cerveza referenciada debe existir** (validación [A]).
2. **`stock_actual >= cantidad`** para cada ítem (validación [A]).
3. **El stock se descuenta al crear el pedido** (no al aprobar). Decisión de diseño: el inventario refleja "reservado", no "vendido".
4. **El pedido nace con `estado: 'pendiente'`** (lo fija el controller antes de invocar).

### Reglas ausentes (gaps)

1. **No valida `cantidad > 0` ni entera** → `cantidad: -1` **suma** stock por `$inc: -(-1)`.
2. **No valida que `usuario_id` exista ni que esté `activo`.**
3. **No restituye stock al rechazar ni al eliminar pedido.**
4. **No define máquina de estados** — se puede ir de `aprobado` a `pendiente`, o de `rechazado` a `aprobado`, libremente.
5. **No valida que el body del `PATCH` solo contenga `aprobado_por`/`estado`** (lo hace por destructuring en el controller, pero el service no es defensivo).

---

## 6. Riesgos (en orden de severidad)

### R1 — Race condition / sobreventa de stock (CRÍTICO)

Dos `createPedido` concurrentes sobre la misma cerveza con `stock_actual = 10` pidiendo 7 cada uno:

```
T1: [A] lee stock=10, valida 10 >= 7 ✅
T2: [A] lee stock=10, valida 10 >= 7 ✅
T1: [B] descuenta 7 → stock=3
T2: [B] descuenta 7 → stock=-4
T1: [C] persiste pedido
T2: [C] persiste pedido
```

Resultado: **dos pedidos válidos, stock negativo, sobreventa**.

Causa: no hay transacción, ni `findOneAndUpdate` condicional (`stock_actual >= cantidad` como filtro). La validación y el descuento son operaciones separadas.

### R2 — Inconsistencia parcial si [C] falla

Si Mongo se cae entre [B] y [C] (descuento exitoso, persistencia fallida), el stock queda descontado pero **no hay pedido**. Stock perdido sin trazabilidad.

### R3 — Stock perdido al rechazar o eliminar

- `updatePedido(id, {estado:'rechazado'})` no devuelve stock.
- `deletePedidoById(id)` tampoco.

Funcionalmente: rechazar un pedido es equivalente a "perder mercadería".

### R4 — `cantidad` negativa SUMA stock

El service no valida; el `$inc: -cantidad` con `cantidad: -5` resuelve a `+5`. Un cliente que conozca la API puede inflar el stock indefinidamente.

### R5 — `usuario_id` viene del body

El controller lee `req.body.usuario_id` y se lo pasa al service. Un cliente puede crear pedidos a nombre de otro usuario simplemente cambiando el ID.

### R6 — N+1 en validación

[A] hace `N` queries (una por ítem). Para un pedido de 50 cervezas son 50 round-trips a Mongo. Mejor: un único `find({_id: {$in: [...]}})`.

### R7 — `populate` roto

[`Pedido.js:11`](../../backEnd/models/Pedido.js#L11) declara `ref: 'cervezas'` pero el modelo `Cerveza` se registra como `'Cerveza'`. Cuando alguien agregue `.populate('cervezas.cerveza')` no va a resolver nada.

### R8 — Regla de negocio en el repository

La lógica "si `estado === 'aprobado'`, setear `fecha_aprobacion = new Date()`" está en [`pedidoRepository.js:34`](../../backEnd/repository/pedidoRepository.js#L34). Es una **regla de dominio**, debería vivir en el service. Si mañana cambia (por ejemplo, agregar `fecha_rechazo` cuando `estado === 'rechazado'`), hay que mirar en el lugar equivocado.

---

## 7. Mejoras posibles (priorizadas)

### Prioridad 1 — Correctitud

1. **Transacción Mongo en `createPedido`.** Esqueleto:

   ```js
   const mongoose = require('mongoose');

   const createPedido = async (pedidoData) => {
       const session = await mongoose.startSession();
       try {
           let pedido;
           await session.withTransaction(async () => {
               // valida y descuenta en una sola operación atómica por ítem
               for (const item of pedidoData.cervezas) {
                   const cerveza = await Cerveza.findOneAndUpdate(
                       { _id: item.cerveza, stock_actual: { $gte: item.cantidad } },
                       { $inc: { stock_actual: -item.cantidad } },
                       { new: true, session }
                   );
                   if (!cerveza) {
                       throw new Error(`Stock insuficiente o cerveza inexistente: ${item.cerveza}`);
                   }
               }
               pedido = await Pedido.create([pedidoData], { session });
           });
           return pedido[0];
       } finally {
           session.endSession();
       }
   };
   ```

   Esto **fusiona [A] y [B]** en un solo `findOneAndUpdate` atómico que **valida y descuenta** en un paso. Cierra **R1 y R2** simultáneamente.

   > Requiere que el cluster sea **replica set**. MongoDB Atlas lo es por default ✅.

2. **Validar `cantidad`** (entero positivo) en el service antes de tocar Mongo. Cierra **R4**.

   ```js
   if (!Number.isInteger(item.cantidad) || item.cantidad <= 0) {
       throw new Error(`Cantidad inválida para ${item.cerveza}`);
   }
   ```

3. **Restituir stock** al cancelar/eliminar.
   - Crear `cancelarPedido(id)` que: lee el pedido, suma `cantidad` a cada cerveza, marca el pedido como `rechazado`.
   - Llamarla desde `updatePedido` cuando `estado === 'rechazado'`.
   - Decidir si `deletePedidoById` debe rechazarse cuando el pedido todavía descontaba stock (estado `pendiente`), o si debe restituir antes de borrar.
   - Cierra **R3**.

4. **Derivar `usuario_id` del JWT**, no del body. Cierra **R5** (depende del middleware de auth que ya está pendiente — ver [ARCHITECTURE.md §10](ARCHITECTURE.md#10-próximos-pasos-recomendados-orden-sugerido)).

### Prioridad 2 — Calidad

5. **Batch query** en validación: `cervezaRepository.findByIds(ids)` → mapa por ID → validar en memoria. Cierra **R6**.

6. **Mover la regla `fecha_aprobacion`** del repository al service.

7. **Endpoints dedicados**: `PATCH /pedido/:id/aprobar` y `PATCH /pedido/:id/rechazar` en vez del genérico que acepta cualquier campo. Hace explícitas las transiciones y permite validar permisos por acción.

8. **Máquina de estados explícita**:

   ```js
   const TRANSICIONES = {
       pendiente: ['aprobado', 'rechazado'],
       aprobado:  [],
       rechazado: [],
   };
   ```

   Y validar `TRANSICIONES[estadoActual].includes(estadoNuevo)` antes de persistir.

9. **Tests con supertest** del flujo end-to-end:
   - Crear pedido válido → stock descuenta correctamente.
   - Stock insuficiente → 400, stock intacto.
   - Aprobar → `fecha_aprobacion` se setea.
   - Rechazar → stock se restituye.
   - Concurrencia: lanzar dos `POST /pedido` en paralelo, verificar que solo uno gana.

### Prioridad 3 — Producto

10. **Auditoría**: guardar `motivo_rechazo` cuando se rechaza, no solo `aprobado_por`.
11. **Decidir el modelo de stock**: "reserva" (descuenta al crear, hoy) vs "venta" (descuenta al aprobar). Cambia mucho la UX y la consistencia.
12. **Histórico**: cada cambio de estado podría ir a una colección `pedido_eventos` para trazabilidad.

---

## 8. Resumen ejecutivo

| Aspecto | Estado |
|---|---|
| Separación de capas | ✅ Limpia (no rompe service/repository) |
| Composición de operaciones | ⚠️ No atómica (race condition real) |
| Validación de entrada | ⚠️ Mínima (sin chequear `cantidad > 0`) |
| Manejo del stock | ⚠️ Inconsistente (descuenta al crear, no restituye al rechazar) |
| Tests | ❌ Ninguno |
| Acoplamiento | ✅ Bajo (solo dos repositories) |

**Prioridad de intervención**: el `createPedido` con transacción Mongo + validación de `cantidad` + restitución de stock al rechazar. Esas tres mejoras en una sola PR transforman el módulo de "funcional pero frágil" a "robusto".
