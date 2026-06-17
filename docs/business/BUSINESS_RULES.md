# Reglas de Negocio

Sistema de gestión de stock de cervezas y pedidos. Tres roles, tres entidades, tres flujos principales.

---

## 1. Dominio

El sistema modela una pequeña distribuidora de cervezas:

- Hay un **catálogo de cervezas** con stock controlado.
- Los **clientes** arman **pedidos** seleccionando cervezas y cantidades.
- Los **empleados** y **admins** gestionan stock y resuelven pedidos.
- Los **admins** además administran usuarios (alta de empleados, cambio de rol, activar/desactivar cuentas).

---

## 2. Entidades

### 2.1 Usuario
[backEnd/models/Usuario.js](../../backEnd/models/Usuario.js)

| Campo | Tipo | Reglas |
|---|---|---|
| `_id` | ObjectId | autogenerado |
| `nombre` | string | requerido |
| `email` | string | requerido, **único** |
| `password` | string | requerido, se persiste hasheado con bcrypt (10 rounds) |
| `rol` | enum | `admin` \| `empleado` \| `cliente`. Default `cliente`. |
| `activo` | boolean | default `true`. Si es `false`, el login es rechazado. |
| `createdAt`, `updatedAt` | timestamps | automáticos |

### 2.2 Cerveza
[backEnd/models/Cerveza.js](../../backEnd/models/Cerveza.js)

| Campo | Tipo | Reglas |
|---|---|---|
| `_id` | ObjectId | autogenerado |
| `nombre` | string | requerido |
| `tipo` | string | requerido (no hay enum: cualquier string) |
| `stock_actual` | number | default `0`. **No puede ser negativo** (validación en `updateCerveza`). |
| `stock_minimo` | number | default `0`. **No puede ser negativo**. |
| `activo` | boolean | default `true`. (No filtra explícitamente en queries; las inactivas se muestran igual.) |
| `createdAt`, `updatedAt` | timestamps | automáticos |

### 2.3 Pedido
[backEnd/models/Pedido.js](../../backEnd/models/Pedido.js)

| Campo | Tipo | Reglas |
|---|---|---|
| `_id` | ObjectId | autogenerado |
| `usuario_id` | ObjectId → Usuario | requerido |
| `fecha` | Date | default `Date.now` |
| `estado` | enum | `pendiente` \| `aprobado` \| `rechazado`. Default `pendiente`. |
| `aprobado_por` | ObjectId → Usuario | default `null`. Se setea al actualizar a `aprobado`/`rechazado`. |
| `fecha_aprobacion` | Date | default `null`. Se setea **solo** cuando `estado === 'aprobado'`. |
| `cervezas[]` | array | requerido (al menos 1 ítem). |
| `cervezas[].cerveza` | ObjectId | requerido (apunta al `_id` de la cerveza). |
| `cervezas[].cantidad` | number | requerido. |
| `createdAt`, `updatedAt` | timestamps | automáticos |

> ✅ Corregido (commit 5f8172e, 2026-06-17): el schema ahora declara `ref: 'Cerveza'` (coincide con el modelo registrado), por lo que `populate` ya funcionaría. ⚠️ Pendiente: las queries de pedido todavía no hacen `populate`, así que en la práctica los nombres aún no se resuelven en el backend (ver §4.3).

---

## 3. Roles y permisos

### Matriz de permisos (intención del diseño)

| Acción | cliente | empleado | admin |
|---|:-:|:-:|:-:|
| Registrarse como cliente | ✅ | — | — |
| Iniciar sesión | ✅ | ✅ | ✅ |
| Ver catálogo de cervezas | ✅ | ✅ | ✅ |
| Crear cerveza | ❌ | ✅ | ✅ |
| Modificar cerveza | ❌ | ✅ | ✅ |
| Eliminar cerveza | ❌ | ✅ | ✅ |
| Crear pedido | ✅ | ❌ | ❌ |
| Ver sus propios pedidos | ✅ | ❌ | ❌ |
| Ver todos los pedidos | ❌ | ✅ | ✅ |
| Aprobar/rechazar pedido | ❌ | ✅ | ✅ |
| Eliminar pedido | ❌ | ✅ | ✅ |
| Listar usuarios | ❌ | ❌ | ✅ |
| Crear empleado | ❌ | ❌ | ✅ |
| Cambiar rol / activar / desactivar usuario | ❌ | ❌ | ✅ |

> ✅ **Estado de implementación** — Corregido (commit 5f8172e, 2026-06-17): la matriz ahora se cumple **también en el backend**, no solo en el frontend. Todas las rutas (salvo `/api/auth/*`) pasan por `verifyToken` (valida el JWT del header `Authorization: Bearer <token>`) y, donde corresponde, por `requireRole(...)` ([middlewares/auth.js](../../backEnd/middlewares/auth.js)). Autorización efectiva por endpoint:
>
> | Recurso | Middleware | Roles permitidos |
> |---|---|---|
> | `/api/auth/*` | (ninguno) | público |
> | `/api/usuarios` (listar/crear empleado/PATCH) | `verifyToken + requireRole('admin')` | admin |
> | `/stock/*` (crear/modificar/eliminar/listar) | `verifyToken + requireRole('admin','empleado')` | admin, empleado |
> | Catálogo `GET /` y `GET /:id` | `verifyToken` | cualquier autenticado |
> | `POST /pedido` | `verifyToken + requireRole('cliente')` | cliente |
> | `GET /pedido` (todos), `PATCH /pedido/:id`, `DELETE /pedido/:id` | `verifyToken + requireRole('admin','empleado')` | admin, empleado |
> | `GET /pedido/:id`, `GET /pedido/usuario/:usuarioId` | `verifyToken` | cualquier autenticado |
>
> Un token ausente o inválido devuelve **401**; un rol sin permiso devuelve **403**. Los guards del frontend (`AuthGuard`, `RoleGuard`, `AdminGuard`, `EmpleadoGuard`, `ClienteGuard`) siguen actuando como primera línea de UX, pero ya no son la única barrera. Ver [ARCHITECTURE.md §9](../architecture/ARCHITECTURE.md#9-problemas-de-seguridad).

---

## 4. Reglas por entidad

### 4.1 Usuario

#### Registro (`POST /api/auth/register`)
- El email **debe ser único** (rechazo con 400 si ya existe).
- La password se hashea con bcrypt antes de persistir.
- El rol por defecto es `cliente`. El cuerpo puede enviar `rol: "empleado"`, pero **solo el flujo "admin crea empleado" debe usarlo** (regla de UI: en el front, `RegisterComponent` agrega `rol:"empleado"` cuando la URL es `/admin/crear-empleado`).
- No hay validación de longitud ni complejidad de password (huella de deuda técnica).

#### Login (`POST /api/auth/login`)
- Si el usuario no existe → el service lanza error con `status 404` (revela existencia, enumerar usuarios es posible).
- Si `activo === false` → el service lanza error con `status 404` (mensaje: "El usuario no esta activo.").
- Si password no coincide → el service lanza error con `status 401`.
- Si todo OK, se emite JWT firmado con payload `{_id, rol}` y `expiresIn: '1h'`.

> ✅ **Código vs. intención** — Corregido (commit 5f8172e, 2026-06-17): el `authController.login` ahora hace `res.status(error.status || 500)` en el `catch` ([authController.js:16-18](../../backEnd/controllers/authController.js#L16-L18)), igual que `register`. Por lo tanto los fallos de login devuelven el HTTP correcto: **404** (usuario inexistente o inactivo), **401** (password incorrecta), y **500** solo ante errores inesperados. Antes el controller respondía **500** fijo en todos los casos. Ver [docs/api §3.2](../api/README.md#32-post-apiauthlogin).
>
> ⚠️ Pendiente: al distinguir 404 (no existe) de 401 (password incorrecta), el login sigue permitiendo **enumeración de usuarios**.

#### Activar/desactivar y cambiar rol (`PATCH /api/usuarios/:id`)
- El admin puede setear `activo: true/false` y/o cambiar el `rol`.
- Mongoose corre validators de schema, así que el `rol` queda restringido al enum `admin|empleado|cliente`.
- Un usuario desactivado no puede loguearse (se valida en el login).

#### Crear empleado (`POST /api/usuarios`)
- Fuerza `rol: 'empleado'` en el service (el body solo aporta `nombre`, `email`, `password`).
- Hashea password.
- Rechaza con 409 si el email ya está registrado.

### 4.2 Cerveza

#### Crear (`POST /stock`)
- `nombre` y `tipo` son obligatorios.
- `stock_actual` y `stock_minimo` deben ser numéricos si vienen.
- `activo` debe ser booleano si viene.
- ✅ Corregido (commit 5f8172e, 2026-06-17): la validación ahora usa `if (stock_actual !== undefined && typeof stock_actual !== "number")` (ídem `stock_minimo` y `activo`), así que `stock_actual = 0` y `activo = false` ya se validan correctamente (antes el chequeo falsy los ignoraba).

#### Modificar (`PATCH /stock/:id`)
- Solo se actualizan los campos presentes en el body (las validaciones explícitas de tipo no se ejecutan aquí — confía en Mongoose).
- `stock_actual < 0` → error explícito en el repositorio.
- `stock_minimo < 0` → error explícito en el repositorio.

#### Eliminar (`DELETE /stock/:id`)
- Es un delete físico (`findByIdAndDelete`).
- No hay verificación de pedidos pendientes que la referencien (potencial integridad rota).

#### Listar (`GET /` y `GET /stock`)
- Devuelve todas las cervezas, incluyendo `activo: false`.
- Sin paginación.

### 4.3 Pedido

#### Crear (`POST /pedido`)
- Solo lo puede invocar un **cliente** (`requireRole('cliente')`).
- Body requerido: `{ cervezas: [{cerveza, cantidad}, ...] }`.
- ✅ Corregido (commit 5f8172e, 2026-06-17): el `usuario_id` se deriva del **token** (`req.user._id`), **ya no se lee del body**. Un cliente ya no puede crear pedidos a nombre de otro usuario.
- Validaciones en controller:
  - `cervezas` es array no vacío.
  - ✅ Corregido (commit 5f8172e, 2026-06-17): cada ítem debe tener `cerveza` y una `cantidad` **entera mayor a 0** (`Number.isInteger(item.cantidad) && item.cantidad > 0`). Antes `cantidad: 0` o negativa entraba al sistema (y una cantidad negativa **sumaba** stock vía `$inc`).
- Validaciones en service ([pedidoService.js:6-39](../../backEnd/services/pedidoService.js#L6-L39)):
  - Cada cerveza referenciada **debe existir** (si no, lanza `"Cerveza con ID <id> no encontrada"`).
  - El descuento de stock es **atómico y condicional** (`findOneAndUpdate({ _id, stock_actual: { $gte: cantidad } }, { $inc: -cantidad })`); si para algún ítem no hay stock, lanza `"Stock insuficiente para <nombre>"`.
- Si todo OK:
  1. Descuenta `cantidad` del `stock_actual` de cada cerveza, ítem por ítem, de forma atómica.
  2. Persiste el pedido con `estado = "pendiente"`.

#### Reglas de stock al crear
- ✅ Mitigado — atómico ante concurrencia (commit 5f8172e, 2026-06-17): el descuento usa `descontarStockSiHay`, que solo descuenta si `stock_actual >= cantidad` en la misma operación. Dos `createPedido` simultáneos ya no pueden sobrevender el mismo stock por carrera de lectura.
- ✅ Mitigado — rollback ante fallo parcial (commit 5f8172e, 2026-06-17): si un ítem posterior no tiene stock, se **restituye** lo ya descontado de los ítems previos; y si la persistencia del pedido falla luego del descuento, también se restituye todo. El stock ya no se pierde silenciosamente.
- ⚠️ Pendiente: **no hay transacción multi-documento real**. La consistencia se logra con descuento atómico por ítem + rollback manual, no con una sesión/transacción de Mongo. Ante un crash entre el descuento y el rollback el stock podría quedar inconsistente.

#### Aprobar/rechazar (`PATCH /pedido/:id`)
- Solo admin/empleado (`requireRole('admin','empleado')`).
- Body acepta `{ aprobado_por, estado }`.
- `estado` debe pertenecer a `['pendiente', 'aprobado', 'rechazado']`.
- Si `estado === 'aprobado'`, automáticamente se setea `fecha_aprobacion = new Date()`.
- ✅ Corregido (commit 5f8172e, 2026-06-17): el stock **sí se restituye al rechazar**. Si un pedido que tenía stock reservado (estado `pendiente` o `aprobado`) pasa a `rechazado`, se devuelve la `cantidad` de cada ítem (`restituirStock`). Y si se "des-rechaza" (de `rechazado` a `aprobado`/`pendiente`), el stock se **vuelve a reservar** (`descontarStockActualById`). Antes el stock quedaba permanentemente perdido al rechazar.

#### Eliminar (`DELETE /pedido/:id`)
- Solo admin/empleado (`requireRole('admin','empleado')`).
- Borrado físico (`findByIdAndDelete`).
- ✅ Corregido (commit 5f8172e, 2026-06-17): si el pedido tenía stock reservado (estado `pendiente` o `aprobado`), al eliminarlo se **restituye** la `cantidad` de cada ítem. Un pedido ya `rechazado` no restituye (su stock ya fue devuelto al rechazarse).

#### Listar
- `GET /pedido` → todos (admin/empleado).
- `GET /pedido/:id` → uno por ID (cualquier autenticado).
- `GET /pedido/usuario/:usuarioId` → todos los del usuario (cualquier autenticado).
- ⚠️ Pendiente: ningún listado hace `populate`, así que los nombres de cervezas y de aprobador no vienen — el frontend debe resolverlos por su cuenta. (El `ref` del schema ya está corregido a `'Cerveza'`, así que el `populate` funcionaría si se agregara; ver §2.3.)

---

## 5. Estados del Pedido

```
                    ┌────────────────────┐
                    │   (cliente crea)   │
                    │   estado=pendiente │
                    │   stock descontado │
                    └─────────┬──────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼                               ▼
   ┌───────────────────┐           ┌───────────────────┐
   │ empleado/admin    │           │ empleado/admin    │
   │ aprueba           │           │ rechaza           │
   │ estado=aprobado   │           │ estado=rechazado  │
   │ fecha_aprobacion= │           │ (stock SÍ se      │
   │ now               │           │  restituye ✅)    │
   │ aprobado_por=X    │           │ aprobado_por=X    │
   └───────────────────┘           └───────────────────┘
```

> ✅ Corregido (commit 5f8172e, 2026-06-17): al pasar a `rechazado` el stock reservado **se restituye** (antes quedaba perdido). Si un pedido `rechazado` vuelve a `aprobado`/`pendiente`, el stock se reserva de nuevo. Ver §4.3.

**Transiciones permitidas** (por el enum y el repositorio):
- `pendiente → aprobado`
- `pendiente → rechazado`
- ⚠️ Pendiente: cualquier otra transición sigue técnicamente permitida porque **no hay máquina de estados** — la regla "solo desde pendiente" no está implementada. La lógica de stock sí maneja correctamente el re-reservar/restituir según el estado origen/destino, pero no impide la transición en sí.

---

## 6. Reglas de stock

- `stock_actual` representa el inventario disponible (post-descuento por pedidos pendientes/aprobados).
- `stock_minimo` representa el umbral de alerta — **no se usa hoy** en la lógica de creación ni de validación. El frontend `pedidos.component.ts` lo usa para calcular `getMaxCantidad = max(1, stock_actual - stock_minimo)`, lo que actúa como límite suave en el carrito.
- El campo `activo` de cerveza **no filtra** la disponibilidad para crear pedidos. Una cerveza con `activo:false` aún puede ser pedida si el cliente conoce su ID y queda stock.

### Consecuencias funcionales del diseño actual

| Escenario | Resultado |
|---|---|
| Cliente arma pedido y lo envía con stock suficiente | OK, stock descuenta (atómico), pedido pendiente |
| Cliente arma pedido y otro cliente le gana en concurrencia | ✅ Sin sobreventa: descuento atómico condicional (`$gte`); el segundo recibe "Stock insuficiente" (commit 5f8172e) |
| Empleado rechaza un pedido | ✅ Stock se restituye (commit 5f8172e) |
| Empleado elimina un pedido | ✅ Stock se restituye si estaba reservado (commit 5f8172e) |
| Cliente intenta pedir más de lo disponible | Backend rechaza con "Stock insuficiente para X" |
| Cliente envía `cantidad` 0 o negativa | ✅ Rechazado en el controller: debe ser entero > 0 (commit 5f8172e) |
| Cerveza marcada inactiva | ⚠️ Pendiente: sigue apareciendo en el listado y puede ser pedida (no se filtra por `activo`) |
| `stock_actual` queda por debajo de `stock_minimo` | ⚠️ Pendiente: `stock_minimo` no se usa en el backend; no se notifica ni se bloquean nuevos pedidos |

---

## 7. Reglas de sesión

- El JWT tiene `expiresIn: '1h'`.
- No hay refresh tokens.
- El frontend mantiene la sesión en `localStorage` (`token`, `user`).
- Si el token expira, el frontend **no lo detecta automáticamente**: las peticiones al backend fallan con **401** (el backend ahora valida el JWT en `verifyToken` — corregido en commit 5f8172e, 2026-06-17).
- `logout` limpia `localStorage` y redirige a `/login`.

---

## 8. Casos borde y zonas grises

| Caso | Comportamiento actual | Comentario |
|---|---|---|
| Email con espacios o mayúsculas distinto a la fila guardada | ⚠️ Pendiente: `findOne({email})` sigue siendo case-sensitive, no normaliza | Debería hacerse `.toLowerCase().trim()` antes de comparar y de guardar |
| `cantidad: 0` o `cantidad: -1` en pedido | ✅ Corregido (commit 5f8172e): el controller exige `Number.isInteger(cantidad) && cantidad > 0`; se rechaza con 400 antes de tocar stock | Resuelto |
| `cervezas: []` en pedido | Rechazado (`length === 0`) | OK |
| Pedido referenciando una cerveza eliminada | ⚠️ Pendiente: el pedido queda con un ID huérfano (no hay FK real en Mongo) | Sin populate falla silencioso; con populate (ref ya corregido) devolvería `null` |
| Usuario inactivo intentando crear pedido | ⚠️ Pendiente: `/pedido` valida el token y el rol `cliente`, pero **no rechequea `activo`**. Solo el login valida `activo`. | Un cliente desactivado tras emitir su token (vigente 1h) aún puede crear pedidos hasta que expire. Debería revalidarse `activo` en `verifyToken` o al crear pedido |
| Cliente intentando pedir a nombre de otro usuario | ✅ Corregido (commit 5f8172e): el `usuario_id` se deriva del JWT (`req.user._id`), ya no se lee del body | Resuelto |
| Modificar `_id`, `email` o `password` vía `PATCH /api/usuarios/:id` | ✅ Corregido (commit 5f8172e): `updateUsuarioService` aplica una **whitelist** (`nombre`, `email`, `rol`, `activo`); cualquier otro campo del body se descarta | Resuelto (el endpoint además ya exige rol `admin`) |
| Doble click en "crear pedido" desde el frontend | ⚠️ Pendiente: se enviarían dos requests; sin idempotencia se crean dos pedidos | Debounce/loader en el componente |

---

## 9. Glosario rápido

- **Admin**: usuario con acceso total, incluyendo gestión de usuarios y empleados.
- **Empleado**: gestiona stock y resuelve pedidos. No gestiona usuarios.
- **Cliente**: arma y envía pedidos. Es el único que crea pedidos.
- **Pedido pendiente**: creado por un cliente, aún no resuelto. Ya descontó stock.
- **Pedido aprobado**: confirmado por un empleado/admin. Tiene `aprobado_por` y `fecha_aprobacion`.
- **Pedido rechazado**: descartado por un empleado/admin. Tiene `aprobado_por` pero `fecha_aprobacion = null`.
- **`stock_actual`**: cantidad físicamente disponible (ya descontados los pedidos creados).
- **`stock_minimo`**: umbral de alerta, hoy sólo usado por la UI del carrito.
