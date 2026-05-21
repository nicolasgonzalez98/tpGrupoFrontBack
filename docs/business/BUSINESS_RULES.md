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

> ⚠️ Bug conocido: el schema declara `ref: 'cervezas'`, pero el modelo está registrado como `'Cerveza'`. `populate` no funcionará hasta arreglarlo.

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

> ⚠️ **Estado de implementación**: esta matriz se cumple **únicamente en el frontend** mediante guards (`AuthGuard`, `RoleGuard`, `AdminGuard`, `EmpleadoGuard`, `ClienteGuard`). El backend hoy **no autoriza nada**: cualquier rol puede llamar cualquier endpoint si conoce la URL. Ver [ARCHITECTURE.md §9](../architecture/ARCHITECTURE.md#9-problemas-de-seguridad).

---

## 4. Reglas por entidad

### 4.1 Usuario

#### Registro (`POST /api/auth/register`)
- El email **debe ser único** (rechazo con 400 si ya existe).
- La password se hashea con bcrypt antes de persistir.
- El rol por defecto es `cliente`. El cuerpo puede enviar `rol: "empleado"`, pero **solo el flujo "admin crea empleado" debe usarlo** (regla de UI: en el front, `RegisterComponent` agrega `rol:"empleado"` cuando la URL es `/admin/crear-empleado`).
- No hay validación de longitud ni complejidad de password (huella de deuda técnica).

#### Login (`POST /api/auth/login`)
- Si el usuario no existe → 404 (revela existencia, enumerar usuarios es posible).
- Si `activo === false` → 404 (mensaje: "El usuario no esta activo").
- Si password no coincide → 401.
- Si todo OK, se emite JWT firmado con payload `{_id, rol}` y `expiresIn: '1h'`.

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
- ⚠️ Bug: la validación `if (stock_actual && typeof stock_actual !== "number")` ignora `0` (falsy), por lo que un `stock_actual = 0` "pasa" sin validar tipo.

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
- Body requerido: `{ usuario_id, cervezas: [{cerveza, cantidad}, ...] }`.
- Validaciones en controller:
  - `usuario_id` presente.
  - `cervezas` es array no vacío.
  - Cada ítem tiene `cerveza` y `cantidad` (no se valida que `cantidad > 0` ni que sea entero).
- Validaciones en service ([pedidoService.js:5-13](../../backEnd/services/pedidoService.js#L5-L13)):
  - Cada cerveza referenciada **debe existir**.
  - `stock_actual >= cantidad` para cada ítem (si falla, lanza `"Stock insuficiente para <nombre>"`).
- Si todo OK:
  1. Descuenta `cantidad` del `stock_actual` de cada cerveza (vía `$inc: -cantidad`).
  2. Persiste el pedido con `estado = "pendiente"`.

#### Reglas de stock al crear
- **No es transaccional**: el descuento y la creación del pedido son operaciones separadas. Si la creación del pedido falla después del descuento, el stock queda perdido.
- **No es atómico ante concurrencia**: dos `createPedido` simultáneos pueden ver el mismo `stock_actual` y ambos descontar, sobrevendiendo stock.

#### Aprobar/rechazar (`PATCH /pedido/:id`)
- Body acepta `{ aprobado_por, estado }`.
- `estado` debe pertenecer a `['pendiente', 'aprobado', 'rechazado']`.
- Si `estado === 'aprobado'`, automáticamente se setea `fecha_aprobacion = new Date()`.
- ⚠️ **No se restituye stock al rechazar**: si un pedido se rechaza después de haber descontado stock, ese stock queda permanentemente perdido (no se devuelve).

#### Eliminar (`DELETE /pedido/:id`)
- Borrado físico, sin restitución de stock.

#### Listar
- `GET /pedido` → todos (admin/empleado).
- `GET /pedido/:id` → uno por ID.
- `GET /pedido/usuario/:usuarioId` → todos los del usuario.
- Ningún listado hace `populate`, así que los nombres de cervezas y de aprobador no vienen — el frontend debe resolverlos por su cuenta.

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
   │ fecha_aprobacion= │           │ (stock NO se      │
   │ now               │           │  restituye ⚠️)    │
   │ aprobado_por=X    │           │ aprobado_por=X    │
   └───────────────────┘           └───────────────────┘
```

**Transiciones permitidas** (por el enum y el repositorio):
- `pendiente → aprobado`
- `pendiente → rechazado`
- (cualquier otra transición está técnicamente permitida porque no hay máquina de estados — la regla "solo desde pendiente" no está implementada).

---

## 6. Reglas de stock

- `stock_actual` representa el inventario disponible (post-descuento por pedidos pendientes/aprobados).
- `stock_minimo` representa el umbral de alerta — **no se usa hoy** en la lógica de creación ni de validación. El frontend `pedidos.component.ts` lo usa para calcular `getMaxCantidad = max(1, stock_actual - stock_minimo)`, lo que actúa como límite suave en el carrito.
- El campo `activo` de cerveza **no filtra** la disponibilidad para crear pedidos. Una cerveza con `activo:false` aún puede ser pedida si el cliente conoce su ID y queda stock.

### Consecuencias funcionales del diseño actual

| Escenario | Resultado |
|---|---|
| Cliente arma pedido y lo envía con stock suficiente | OK, stock descuenta, pedido pendiente |
| Cliente arma pedido y otro cliente le gana en concurrencia | Posible sobreventa (sin transacción) |
| Empleado rechaza un pedido | Stock queda perdido (bug) |
| Empleado elimina un pedido | Stock queda perdido (bug) |
| Cliente intenta pedir más de lo disponible | Backend rechaza con "Stock insuficiente para X" |
| Cerveza marcada inactiva | Sigue apareciendo en el listado y puede ser pedida (no se filtra) |
| `stock_actual` queda por debajo de `stock_minimo` | No se notifica ni se bloquean nuevos pedidos |

---

## 7. Reglas de sesión

- El JWT tiene `expiresIn: '1h'`.
- No hay refresh tokens.
- El frontend mantiene la sesión en `localStorage` (`token`, `user`).
- Si el token expira, el frontend **no lo detecta automáticamente**: las peticiones al backend van a fallar (cuando el backend valide JWT, hoy no lo hace).
- `logout` limpia `localStorage` y redirige a `/login`.

---

## 8. Casos borde y zonas grises

| Caso | Comportamiento actual | Comentario |
|---|---|---|
| Email con espacios o mayúsculas distinto a la fila guardada | `findOne({email})` es case-sensitive, no normaliza | Debería hacerse `.toLowerCase().trim()` antes de comparar y de guardar |
| `cantidad: 0` o `cantidad: -1` en pedido | No se valida; entra al sistema y descuenta `0` o **suma** stock (porque `$inc: -(-1) = +1`) | Validar `cantidad > 0` y entero |
| `cervezas: []` en pedido | Rechazado (`length === 0`) | OK |
| Pedido referenciando una cerveza eliminada | El pedido queda con un ID huérfano (no hay FK real en Mongo) | Sin populate falla silencioso; con populate devolvería `null` |
| Usuario inactivo intentando crear pedido | El back **no chequea `activo`** en `/pedido`. Solo el login valida. | Hoy basta con tener un token (cuando se implemente la auth en el back) o con saberse un `usuario_id` válido |
| Cliente intentando pedir a nombre de otro usuario | Pasa: el `usuario_id` viene en el body y no se compara con la sesión | Debe derivarse del JWT |
| Modificar `_id` o `email` vía `PATCH /api/usuarios/:id` | No filtra el body; Mongoose probablemente ignore `_id` pero `email` sí cambiaría | Whitelist explícita de campos |
| Doble click en "crear pedido" desde el frontend | Se enviarían dos requests; sin idempotencia se crean dos pedidos | Debounce/loader en el componente |

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
