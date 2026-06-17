# Módulo: `pedidoService.js`

Análisis técnico en profundidad del service que gestiona el ciclo de vida de los pedidos.

- **Archivo:** [`backEnd/services/pedidoService.js`](../../backEnd/services/pedidoService.js)
- **Capa:** Service (lógica de negocio)
- **Dependencias directas:** `pedidoRepository`, `cervezaRepository`
- **Última verificación:** 2026-06-17 (refleja el commit `5f8172e` en `main`)

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
  - Descontar stock de forma **atómica y condicional** (`descontarStockSiHay`) con **rollback manual** si algún ítem no tiene stock o si falla la persistencia.
  - **Restituir stock** al rechazar o eliminar un pedido que tenía stock reservado, y **re-reservar** al des-rechazar.
  - Componer la operación "reservar stock + crear pedido".

---

## 2. Dependencias

```js
const pedidoRepository = require('../repository/pedidoRepository');
const cervezaRepository = require('../repository/cervezaRepository');
```

| Dependencia | Uso |
|---|---|
| [`pedidoRepository`](../../backEnd/repository/pedidoRepository.js) | CRUD del documento `Pedido` |
| [`cervezaRepository`](../../backEnd/repository/cervezaRepository.js) | `getCervezaById`, `descontarStockSiHay`, `restituirStock`, `descontarStockActualById` |

**No depende de** (y debería):
- `userRepository` — ⚠️ aunque ahora `usuario_id` viene del token JWT (no del body), el service **no valida** que el usuario exista ni que esté `activo` contra la DB.
- Un logger configurable — usa `console.*` indirectamente vía controllers.
- Un clock inyectable — `new Date()` se llama directo en el repository (regla `fecha_aprobacion`, ver R8 — sigue pendiente).

---

## 3. Funciones expuestas

| Función | Tipo | Responsabilidad |
|---|---|---|
| `createPedido(pedidoData)` | composición | Valida existencia + descuenta atómico condicional (rollback) + persiste |
| `getAllPedidos()` | pass-through | Lista todos los pedidos |
| `getPedidoById(id)` | pass-through | Lee un pedido por ID |
| `getPedidosByUsuario(usuarioId)` | pass-through | Lista pedidos de un usuario |
| `deletePedidoById(id)` | composición | Borrado físico + **restitución de stock** si estaba reservado |
| `updatePedido(id, {aprobado_por, estado})` | composición | Cambia estado/`aprobado_por` + **restituye o re-reserva stock** según la transición |

### 3.1 `createPedido` — la función con lógica real

```js
const ESTADOS_CON_STOCK_RESERVADO = ['pendiente', 'aprobado'];

const createPedido = async (pedidoData) => {
    // [A] Validar que todas las cervezas existan.
    for (const item of pedidoData.cervezas) {
        const cerveza = await cervezaRepository.getCervezaById(item.cerveza);
        if (!cerveza) {
            throw new Error(`Cerveza con ID ${item.cerveza} no encontrada`);
        }
    }

    // [B] Descuento atómico condicional + rollback manual si algún ítem no tiene stock.
    const descontadas = [];
    for (const item of pedidoData.cervezas) {
        const ok = await cervezaRepository.descontarStockSiHay(item.cerveza, item.cantidad);
        if (!ok) {
            for (const d of descontadas) {
                await cervezaRepository.restituirStock(d.cerveza, d.cantidad);
            }
            const cerveza = await cervezaRepository.getCervezaById(item.cerveza);
            throw new Error(`Stock insuficiente para ${cerveza?.nombre || 'la cerveza seleccionada'}`);
        }
        descontadas.push(item);
    }

    // [C] Persistir el pedido; si falla, restituir todo lo descontado.
    try {
        return await pedidoRepository.createPedido(pedidoData);
    } catch (err) {
        for (const d of descontadas) {
            await cervezaRepository.restituirStock(d.cerveza, d.cantidad);
        }
        throw err;
    }
};
```

Tres fases secuenciales:

- **[A] Validación de existencia** — recorre cada ítem y lo trae de Mongo (`getCervezaById`) solo para verificar que exista. La comprobación de stock **ya no se hace aquí** (se delega al filtro atómico de [B]).
- **[B] Descuento atómico condicional** — por cada ítem invoca `cervezaRepository.descontarStockSiHay(id, cantidad)`, que ejecuta un `findOneAndUpdate({_id, stock_actual: {$gte: cantidad}}, {$inc: {stock_actual: -cantidad}})` y devuelve `true`/`false`. Si alguno devuelve `false` (sin stock), se hace **rollback manual** restituyendo (`restituirStock`) todo lo ya descontado y se lanza `"Stock insuficiente para <nombre>"`.
- **[C] Persistencia** — crea el documento `Pedido` con `estado: 'pendiente'` (el estado lo agrega el controller). Si la creación falla, se **restituye todo lo descontado** y se re-lanza el error.

✅ **Resuelto (commit `5f8172e`):** el descuento condicional por ítem **cierra la sobreventa por concurrencia (R1)** y el rollback en `catch` **cierra la inconsistencia parcial si falla la persistencia (R2)**.

⚠️ **Pendiente:** sigue **sin transacción multi-documento real**. El rollback es manual (best-effort): si el proceso muere a mitad del rollback, puede quedar stock descontado sin pedido. Una transacción Mongo (`session.withTransaction`) lo haría verdaderamente atómico.

### 3.2 Resto de funciones

Las tres lecturas siguen siendo **pass-through**; `deletePedidoById` y `updatePedido` ahora tienen lógica de stock. Detalles:

- **`getAllPedidos`** — pass-through. Sin paginación y ⏳ sin `populate` → devuelve los `ObjectId` sueltos (el `ref` ya está bien, pero no se invoca `populate`).
- **`getPedidoById`** — pass-through. Usa `findOne({_id: id})`, ⏳ sin `populate`.
- **`getPedidosByUsuario`** — pass-through. Filtra por `usuario_id`, ⏳ sin `populate`.
- **`deletePedidoById`** — ✅ **Resuelto (commit `5f8172e`):** lee el pedido; si su estado está en `ESTADOS_CON_STOCK_RESERVADO` (`pendiente`/`aprobado`), **restituye** el stock de cada ítem (`restituirStock`) tras borrarlo. Si el pedido ya estaba `rechazado`, no restituye (el stock ya había sido liberado).
- **`updatePedido`** — ✅ **Resuelto (commit `5f8172e`)** en lo que toca a stock:
  - Si el pedido pasa de un estado reservado (`pendiente`/`aprobado`) a `rechazado` → **restituye** stock.
  - Si pasa de `rechazado` a un estado reservado (`aprobado`/`pendiente`) → **re-reserva** (descuenta con `descontarStockActualById`).
  - ⚠️ La regla "si `estado === 'aprobado'` setear `fecha_aprobacion`" **sigue viviendo en el repository** ([`pedidoRepository.js`](../../backEnd/repository/pedidoRepository.js)), no en el service (ver R8).
  - ⚠️ La re-reserva usa `descontarStockActualById` (descuento **incondicional**), no el condicional `descontarStockSiHay`: al des-rechazar podría dejar `stock_actual` negativo si ya no hay stock.

---

## 4. Endpoints que lo consumen

Definidos en [`backEnd/routes/pedidoRoutes.js`](../../backEnd/routes/pedidoRoutes.js):

Todas las rutas pasan por `router.use(verifyToken)` (requieren sesión válida) y, donde corresponde, por `requireRole(...)`:

| Método | Ruta | Function | Middleware de autorización |
|---|---|---|---|
| `POST` | `/pedido/` | `createPedido` | `verifyToken` + `requireRole('cliente')` |
| `GET` | `/pedido/` | `getAllPedidos` | `verifyToken` + `requireRole('admin','empleado')` |
| `GET` | `/pedido/:id` | `getPedidoById` | `verifyToken` (cualquier rol autenticado) |
| `GET` | `/pedido/usuario/:usuarioId` | `getPedidosByUsuario` | `verifyToken` (cualquier rol autenticado) |
| `DELETE` | `/pedido/:id` | `deletePedidoById` | `verifyToken` + `requireRole('admin','empleado')` |
| `PATCH` | `/pedido/:id` | `updatePedido` | `verifyToken` + `requireRole('admin','empleado')` |

> ✅ **Resuelto (commit `5f8172e`):** **todas las rutas están autenticadas** vía `router.use(verifyToken)`, y la autorización por rol vive en el backend (`requireRole`), no solo en los guards del frontend. La nota anterior ("ninguna ruta está autenticada") ya no aplica.
> ⏳ Pendiente: en `GET /pedido/:id` y `GET /pedido/usuario/:usuarioId` no se valida que el cliente solo pueda leer **sus propios** pedidos (cualquier rol autenticado puede leer cualquiera).

---

## 5. Reglas de negocio que aplica

### Reglas implementadas

1. **Cada cerveza referenciada debe existir** (validación [A]).
2. **`stock_actual >= cantidad`** para cada ítem — ahora se garantiza en el **filtro atómico** del descuento ([B], `descontarStockSiHay`), no en una lectura previa.
3. **El stock se descuenta al crear el pedido** (no al aprobar). Decisión de diseño: el inventario refleja "reservado", no "vendido".
4. **El pedido nace con `estado: 'pendiente'`** (lo fija el controller antes de invocar).
5. ✅ **`cantidad` debe ser entera y > 0** — validado en el controller (`Number.isInteger` + `> 0`), responde `400` si no.
6. ✅ **`usuario_id` se deriva del token JWT** (`req.user._id`), no del body.
7. ✅ **Restitución de stock** al rechazar (`updatePedido`) o eliminar (`deletePedidoById`) un pedido reservado, y **re-reserva** al des-rechazar.

### Reglas ausentes (gaps)

1. ⚠️ **No valida que `usuario_id` exista ni que esté `activo`** contra la DB. Mitigado en parte porque ahora viene de un token verificado, pero el service no lo chequea.
2. ⏳ **No define máquina de estados explícita** — se puede ir de `aprobado` a `pendiente`, o de `rechazado` a `aprobado`, libremente. Nota: aunque **la transición no se valida**, su **efecto sobre el stock sí se maneja** (se re-reserva al des-rechazar, se libera al rechazar).
3. ⏳ **No valida que el body del `PATCH` solo contenga `aprobado_por`/`estado`** (lo limita el destructuring del controller, pero el service no es defensivo).
4. ⏳ **N+1 en validación de existencia** (ver R6): una query `getCervezaById` por ítem.

---

## 6. Riesgos (en orden de severidad)

### R1 — Race condition / sobreventa de stock ✅ Resuelto (commit `5f8172e`)

Escenario histórico: dos `createPedido` concurrentes sobre la misma cerveza con `stock_actual = 10` pidiendo 7 cada uno terminaban en `stock = -4` con dos pedidos válidos (sobreventa).

**Mitigado:** el descuento ahora es atómico y condicional por ítem — `descontarStockSiHay` ejecuta `findOneAndUpdate({_id, stock_actual: {$gte: cantidad}}, {$inc: {stock_actual: -cantidad}})`. El filtro y el `$inc` ocurren en una sola operación atómica de Mongo: el segundo request no matchea el filtro (stock ya en 3) y recibe `false`, se hace rollback y se lanza "Stock insuficiente". **Ya no hay sobreventa.**

⚠️ Matiz: la atomicidad es **por documento/ítem**, no multi-documento. Para un pedido con varios ítems el rollback de los ítems previos es manual (best-effort), no una transacción real.

### R2 — Inconsistencia parcial si [C] falla ✅ Resuelto (commit `5f8172e`)

Si la persistencia del pedido falla tras descontar el stock, el `catch` de [C] **restituye todo lo descontado** (`restituirStock`) antes de re-lanzar. ⚠️ Sigue siendo un rollback manual: si el proceso muere durante el rollback, puede quedar stock descontado sin pedido. Una transacción Mongo lo cerraría del todo.

### R3 — Stock perdido al rechazar o eliminar ✅ Resuelto (commit `5f8172e`)

- `updatePedido(id, {estado:'rechazado'})` ahora **restituye** stock si el pedido venía de un estado reservado.
- `deletePedidoById(id)` **restituye** stock si el pedido borrado estaba en `pendiente`/`aprobado`.
- Bonus: `updatePedido` **re-reserva** stock al pasar de `rechazado` a `aprobado`/`pendiente`.

### R4 — `cantidad` negativa SUMA stock ✅ Resuelto (commit `5f8172e`)

El controller valida `typeof item.cantidad === 'number' && Number.isInteger(item.cantidad) && item.cantidad > 0`; si no, responde `400`. Además, el filtro `stock_actual: {$gte: cantidad}` no matchearía con una cantidad negativa de forma útil. Ya no se puede inflar stock con cantidades negativas.

### R5 — `usuario_id` viene del body ✅ Resuelto (commit `5f8172e`)

El controller ahora toma `usuario_id = req.user._id` (del token JWT verificado), **ignorando** cualquier `usuario_id` del body. Un cliente ya no puede crear pedidos a nombre de otro.

### R6 — N+1 en validación ⏳ Pendiente

[A] sigue haciendo `N` queries `getCervezaById` (una por ítem). Para un pedido de 50 cervezas son 50 round-trips a Mongo. Mejor: un único `find({_id: {$in: [...]}})`.

### R7 — `populate` roto ✅ Resuelto (commit `5f8172e`)

[`Pedido.js`](../../backEnd/models/Pedido.js) ahora declara `ref: 'Cerveza'` (coincide con el modelo registrado). Un `.populate('cervezas.cerveza')` **resolvería** correctamente. ⏳ Pendiente: las queries de pedido **todavía no invocan `populate`**, así que en la práctica siguen devolviendo `ObjectId` sueltos.

### R8 — Regla de negocio en el repository ⏳ Pendiente

La lógica "si `estado === 'aprobado'`, setear `fecha_aprobacion = new Date()`" está en [`pedidoRepository.js:34`](../../backEnd/repository/pedidoRepository.js#L34). Es una **regla de dominio**, debería vivir en el service. Si mañana cambia (por ejemplo, agregar `fecha_rechazo` cuando `estado === 'rechazado'`), hay que mirar en el lugar equivocado.

---

## 7. Mejoras posibles (priorizadas)

> Estado al 2026-06-17 (commit `5f8172e`): de la Prioridad 1, los puntos **2 (validar `cantidad`)**, **3 (restituir stock)** y **4 (`usuario_id` del JWT)** ya están implementados. El punto **1 (transacción Mongo real)** sigue pendiente — hoy se logra con descuento atómico condicional + rollback manual, suficiente para cerrar R1/R2 en la práctica pero no equivalente a una transacción multi-documento.

### Prioridad 1 — Correctitud

1. ⏳ **Transacción Mongo en `createPedido`.** (Pendiente — hoy hay descuento atómico por ítem + rollback manual, sin `session.withTransaction`.) Esqueleto:

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

   Esto **fusiona [A] y [B]** en un solo `findOneAndUpdate` atómico que **valida y descuenta** en un paso dentro de una transacción real, eliminando el rollback manual. El descuento condicional ya está implementado (`descontarStockSiHay`); lo que falta es envolverlo en `session.withTransaction` para garantizar atomicidad multi-documento.

   > Requiere que el cluster sea **replica set**. MongoDB Atlas lo es por default ✅.

2. ✅ **Validar `cantidad`** (entero positivo) — **implementado** en el controller (`Number.isInteger(item.cantidad) && item.cantidad > 0`, responde `400`). Cierra **R4**.

3. ✅ **Restituir stock** al cancelar/eliminar — **implementado**:
   - `updatePedido` restituye cuando se pasa a `rechazado` desde un estado reservado, y re-reserva al des-rechazar.
   - `deletePedidoById` restituye antes/después de borrar si el pedido estaba reservado.
   - Cierra **R3**. (Pendiente menor: la re-reserva usa descuento incondicional, podría dejar stock negativo.)

4. ✅ **Derivar `usuario_id` del JWT** — **implementado** (`req.user._id` en el controller). Cierra **R5**.

### Prioridad 2 — Calidad

5. ⏳ **Batch query** en validación: `cervezaRepository.findByIds(ids)` → mapa por ID → validar en memoria. Cierra **R6** (pendiente).

6. ⏳ **Mover la regla `fecha_aprobacion`** del repository al service (pendiente).

7. ⏳ **Endpoints dedicados**: `PATCH /pedido/:id/aprobar` y `PATCH /pedido/:id/rechazar` en vez del genérico que acepta cualquier campo. Hace explícitas las transiciones y permite validar permisos por acción.

8. ⏳ **Máquina de estados explícita** (pendiente — hoy las transiciones no se validan, aunque su efecto sobre el stock sí se maneja):

   ```js
   const TRANSICIONES = {
       pendiente: ['aprobado', 'rechazado'],
       aprobado:  [],
       rechazado: [],
   };
   ```

   Y validar `TRANSICIONES[estadoActual].includes(estadoNuevo)` antes de persistir.

9. ⏳ **Tests con supertest** del flujo end-to-end (pendiente — no hay tests):
   - Crear pedido válido → stock descuenta correctamente.
   - Stock insuficiente → 400, stock intacto (verificar el rollback de ítems previos).
   - Aprobar → `fecha_aprobacion` se setea.
   - Rechazar → stock se restituye; des-rechazar → stock se re-reserva.
   - Eliminar pedido reservado → stock se restituye.
   - Concurrencia: lanzar dos `POST /pedido` en paralelo, verificar que solo uno gana (ahora debería pasar gracias al descuento atómico).

### Prioridad 3 — Producto

10. **Auditoría**: guardar `motivo_rechazo` cuando se rechaza, no solo `aprobado_por`.
11. **Decidir el modelo de stock**: "reserva" (descuenta al crear, hoy) vs "venta" (descuenta al aprobar). Cambia mucho la UX y la consistencia.
12. **Histórico**: cada cambio de estado podría ir a una colección `pedido_eventos` para trazabilidad.

---

## 8. Resumen ejecutivo

| Aspecto | Estado |
|---|---|
| Separación de capas | ✅ Limpia (no rompe service/repository) |
| Composición de operaciones | ⚠️ Atómica por ítem + rollback manual (sin transacción multi-documento, pero R1/R2 mitigados) |
| Validación de entrada | ✅ `cantidad` entera > 0 (controller); ⚠️ no valida `usuario_id` contra DB |
| Manejo del stock | ✅ Descuenta al crear, restituye al rechazar/eliminar, re-reserva al des-rechazar |
| Autenticación de rutas | ✅ `verifyToken` + `requireRole` en backend |
| Máquina de estados | ⏳ Transiciones aún no validadas (efecto sobre stock sí manejado) |
| Tests | ❌ Ninguno |
| Acoplamiento | ✅ Bajo (solo dos repositories) |

**Estado al 2026-06-17 (commit `5f8172e`):** la PR de correctitud cerró R1–R5 y R7 (ref). El módulo pasó de "funcional pero frágil" a **robusto en la práctica**. Pendientes principales: transacción Mongo multi-documento real, `populate` efectivo, máquina de estados explícita, mover `fecha_aprobacion` al service, batch query (R6) y tests.
