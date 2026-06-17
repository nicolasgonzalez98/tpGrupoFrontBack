# API REST — Referencia de Endpoints

Referencia completa de la API REST del backend (`backEnd/`). **Todos los contratos descriptos aquí están derivados directamente del código** (`routes/`, `controllers/`, `services/`, `repository/`). No se documentan endpoints ni campos que no existan en el código.

- **Base URL (dev):** `http://localhost:3000`
- **Formato:** JSON (request y response). El backend registra `express.json()` globalmente ([index.js:15](../../backEnd/index.js#L15)).
- **CORS:** abierto a todos los orígenes (`app.use(cors())`, [index.js:14](../../backEnd/index.js#L14)).
- **Autenticación:** el login emite un JWT, pero **ningún endpoint verifica el token** hoy. No hay header `Authorization` requerido por el backend. Ver [seguridad](../security/README.md).

---

## 1. Mapa de routers

El montaje de routers se hace en [index.js:19-27](../../backEnd/index.js#L19-L27):

| Prefijo | Router | Archivo | Acceso real backend |
|---|---|---|---|
| `/api/auth` | auth | [authRoutes.js](../../backEnd/routes/authRoutes.js) | público |
| `/api/usuarios` | adminUsuario | [adminUsuarioRoutes.js](../../backEnd/routes/adminUsuarioRoutes.js) | público (sin validación) |
| `/stock` | stock | [stockRoutes.js](../../backEnd/routes/stockRoutes.js) | público (sin validación) |
| `/pedido` | pedido | [pedidoRoutes.js](../../backEnd/routes/pedidoRoutes.js) | público (sin validación) |
| `/` | cerveza | [cervezaRoutes.js](../../backEnd/routes/cervezaRoutes.js) | público |

> El rol "esperado" de cada endpoint se enumera por intención de diseño (lo aplican los guards del frontend). El backend **no** lo valida. Ver [BUSINESS_RULES §3](../business/BUSINESS_RULES.md#3-roles-y-permisos).

```mermaid
graph LR
    C[Cliente HTTP] -->|HTTP/JSON| EX[Express app]
    EX --> A["/api/auth"]
    EX --> U["/api/usuarios"]
    EX --> S["/stock"]
    EX --> P["/pedido"]
    EX --> CV["/ (cervezas)"]
    A --> AC[authController]
    U --> UC[adminUsuarioController]
    S --> SC[stockController]
    P --> PC[pedidoController]
    CV --> CC[cervezaController]
```

---

## 2. Convenciones de respuesta de error

No hay middleware central de errores; cada controller arma su propio `catch`. Los formatos **no son uniformes**:

| Controller | Forma del error |
|---|---|
| `authController` | `{ "message": "..." }` |
| `adminUsuarioController` | `{ "code": 500, "message": "..." }` o `{ "message": "..." }` |
| `cervezaController` / `stockController` | `{ "error": "..." }` |
| `pedidoController` | `{ "error": "..." }` |

---

## 3. Auth — `/api/auth`

### 3.1 `POST /api/auth/register`

Registra un usuario. Por defecto crea rol `cliente`; si el body trae `rol: "empleado"` se respeta (usado por el flujo "admin crea empleado" del frontend). Cualquier otro valor de `rol` se ignora y queda `cliente`.

**Origen:** [authController.register](../../backEnd/controllers/authController.js#L3) → [authService.register](../../backEnd/services/authService.js#L7)

**Request body**

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| `nombre` | string | sí | |
| `email` | string | sí | único en la colección |
| `password` | string | sí | se hashea con bcrypt (10 rounds) |
| `rol` | string | no | sólo `"empleado"` tiene efecto; otro valor → `cliente` |

```json
{
  "nombre": "Ana",
  "email": "ana@mail.com",
  "password": "secreta123"
}
```

**Respuestas**

| Código | Cuándo | Body |
|---|---|---|
| `201` | creado | `{ "message": "Usuario creado", "user": { "_id", "email", "rol" } }` |
| `400` | email ya registrado | `{ "message": "El email ya está registrado" }` |
| `500` | error inesperado | `{ "message": "Error al registrar usuario" }` |

```json
// 201
{
  "message": "Usuario creado",
  "user": { "_id": "665...", "email": "ana@mail.com", "rol": "cliente" }
}
```

---

### 3.2 `POST /api/auth/login`

Valida credenciales y emite un JWT (`{ _id, rol }`, `expiresIn: '1h'`, secret hardcodeado `"TpCervezas"`).

**Origen:** [authController.login](../../backEnd/controllers/authController.js#L12) → [authService.login](../../backEnd/services/authService.js#L30)

**Request body**

| Campo | Tipo | Requerido |
|---|---|---|
| `email` | string | sí |
| `password` | string | sí |

```json
{ "email": "ana@mail.com", "password": "secreta123" }
```

**Respuestas**

| Código | Cuándo | Body |
|---|---|---|
| `200` | login OK | `{ "message": "Login exitoso", "token": "<jwt>", "user": { "_id", "email", "nombre", "rol", "activo" } }` |
| `500` | **cualquier error** (usuario inexistente, inactivo o password incorrecta) | `{ "message": "<mensaje>" }` |

> ⚠️ **Inconsistencia código vs. intención.** El `authService.login` lanza errores con `error.status = 404` (usuario no encontrado / inactivo) y `error.status = 401` (password incorrecta), pero el controller hace `res.status(500)` fijo en el `catch` ([authController.js:16-18](../../backEnd/controllers/authController.js#L16-L18)) — **ignora `error.status`**. Por lo tanto, en la práctica **todos los fallos de login devuelven `500`**, no `404`/`401`. El mensaje sí distingue el caso (`"Usuario no encontrado"`, `"El usuario no esta activo."`, `"Contraseña incorrecta"`). _Corrección sugerida: usar `res.status(error.status || 500)` como ya hace `register`._

```json
// 200
{
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "_id": "665...", "email": "ana@mail.com", "nombre": "Ana", "rol": "cliente", "activo": true }
}
```

```mermaid
sequenceDiagram
    participant FE as Frontend (AuthService)
    participant API as POST /api/auth/login
    participant SVC as authService
    participant DB as MongoDB (usuarios)
    FE->>API: { email, password }
    API->>SVC: login(body)
    SVC->>DB: findOne({ email })
    alt usuario no existe o inactivo
        SVC-->>API: throw (status 404)
        API-->>FE: 500 { message }
    else password incorrecta
        SVC-->>API: throw (status 401)
        API-->>FE: 500 { message }
    else OK
        SVC->>SVC: jwt.sign({_id, rol})
        SVC-->>API: { token, user }
        API-->>FE: 200 { message, token, user }
    end
```

---

## 4. Usuarios (admin) — `/api/usuarios`

Rol esperado: **admin**. (No validado por el backend.)

### 4.1 `GET /api/usuarios`

Lista todos los usuarios. **Devuelve el campo `password` (hash) de cada usuario** — `Usuario.find()` sin proyección.

**Origen:** [readUsersController](../../backEnd/controllers/adminUsuarioController.js#L18) → [getAllUsuariosService](../../backEnd/services/adminUsuarioService.js#L35) → `getAllUsuariosRepository`

| Código | Body |
|---|---|
| `200` | `[ { _id, nombre, email, password, rol, activo, createdAt, updatedAt, __v }, ... ]` |
| `500` | `{ "code": 500, "message": "Error al obtener los usuarios: ..." }` |

### 4.2 `POST /api/usuarios`

Crea un **empleado**. El service fuerza `rol: 'empleado'`; sólo se usan `nombre`, `email`, `password` del body.

**Origen:** [createEmpleadoController](../../backEnd/controllers/adminUsuarioController.js#L3) → [createEmpleadoService](../../backEnd/services/adminUsuarioService.js#L5)

**Request body**

| Campo | Tipo | Requerido |
|---|---|---|
| `nombre` | string | sí |
| `email` | string | sí (único) |
| `password` | string | sí (se hashea con bcrypt) |

**Respuestas**

| Código | Cuándo | Body |
|---|---|---|
| `200` | creado (status por defecto de `res.send`) | documento Usuario creado, **incluye `password` hash** |
| `409` | email ya registrado | `{ "message": "El email ya está registrado" }` |
| `500` | error | `{ "code": 500, "message": "Error al crear empleado...." }` |

> El service loguea la password en texto plano en consola antes de hashearla ([adminUsuarioService.js:7](../../backEnd/services/adminUsuarioService.js#L7)).

### 4.3 `PATCH /api/usuarios/:id`

Actualiza un usuario. Pensado para activar/desactivar (`activo`) o cambiar `rol`, pero **acepta cualquier campo del body** y lo pasa a `findByIdAndUpdate` (mass-assignment). Corre `runValidators: true`, así que `rol` queda restringido al enum.

**Origen:** [updateUsuarioByIdController](../../backEnd/controllers/adminUsuarioController.js#L30) → [updateUsuarioService](../../backEnd/services/adminUsuarioService.js#L46) → [updateUsuario repo](../../backEnd/repository/adminUsuarioRepository.js#L34)

**Path param:** `id` (ObjectId del usuario)

**Request body (ejemplos):** `{ "activo": false }` · `{ "rol": "empleado" }`

| Código | Cuándo | Body |
|---|---|---|
| `200` | actualizado | documento Usuario actualizado (`{ new: true }`) |
| `404` | id inexistente | `{ "message": "Usuario no encontrado con el ID: <id>" }` |
| `500` | error | `{ "message": "Error al actualizar el usuario." }` |

> ⚠️ Bug conocido: en el `catch` del service, `throw error("...")` invoca la variable `error` (un `Error`, no una función) → lanza `TypeError`; el controller lo convierte en `500`. Ver [BUSINESS_RULES](../business/BUSINESS_RULES.md) / [deuda técnica](../README.md#deuda-técnica).

---

## 5. Cervezas (catálogo público) — `/`

Montado en la raíz. Sólo lectura. Lo consume el cliente para ver el catálogo.

### 5.1 `GET /`

Lista todas las cervezas (incluye `activo: false`, sin paginación).

**Origen:** [cervezaController.getAllCervezas](../../backEnd/controllers/cervezaController.js#L3)

| Código | Body |
|---|---|
| `200` | `[ ICerveza, ... ]` |
| `500` | `{ "error": "..." }` |

### 5.2 `GET /:id`

Obtiene una cerveza por ID. **Atención:** al estar montado en `/`, esta ruta captura cualquier path de un solo segmento no tomado por `/stock`, `/pedido`, `/api/...`.

**Origen:** [cervezaController.getCervezaById](../../backEnd/controllers/cervezaController.js#L12)

| Código | Body |
|---|---|
| `200` | `ICerveza` |
| `404` | `{ "error": "Cerveza no encontrada" }` |
| `500` | `{ "error": "..." }` |

---

## 6. Stock de cervezas — `/stock`

Rol esperado: **admin / empleado**. CRUD completo de cervezas.

### 6.1 `POST /stock`

Crea una cerveza. Valida tipos en el controller.

**Origen:** [stockController.createCerveza](../../backEnd/controllers/stockController.js#L3)

**Request body**

| Campo | Tipo | Requerido | Default | Validación en controller |
|---|---|---|---|---|
| `nombre` | string | sí | — | requerido, string |
| `tipo` | string | sí | — | requerido, string |
| `stock_actual` | number | no | `0` | si viene (truthy), debe ser number |
| `stock_minimo` | number | no | `0` | si viene (truthy), debe ser number |
| `activo` | boolean | no | `true` | si viene (truthy), debe ser boolean |

> ⚠️ Bug de falsy: las validaciones usan `if (stock_actual && ...)`, por lo que `0` y `false` "pasan" sin validar el tipo ([stockController.js:13-19](../../backEnd/controllers/stockController.js#L13-L19)).

```json
{ "nombre": "IPA", "tipo": "Ale", "stock_actual": 100, "stock_minimo": 10, "activo": true }
```

| Código | Cuándo | Body |
|---|---|---|
| `201` | creada | documento `ICerveza` |
| `400` | falta `nombre`/`tipo` o tipo inválido | `{ "error": "<detalle>" }` |
| `400` | error de Mongoose | `{ "error": "<message>" }` |

### 6.2 `GET /stock`

Lista todas las cervezas. **Origen:** [stockController.getAllCervezas](../../backEnd/controllers/stockController.js#L31). Igual que `GET /`.

| Código | Body |
|---|---|
| `200` | `[ ICerveza, ... ]` |
| `500` | `{ "error": "..." }` |

### 6.3 `GET /stock/:id`

| Código | Body |
|---|---|
| `200` | `ICerveza` |
| `404` | `{ "error": "Cerveza no encontrada" }` |
| `500` | `{ "error": "..." }` |

### 6.4 `DELETE /stock/:id`

Borrado físico (`findByIdAndDelete`). No verifica pedidos que la referencien ni restituye nada.

| Código | Body |
|---|---|
| `200` | `{ "message": "Cerveza eliminada correctamente" }` |
| `404` | `{ "error": "Cerveza no encontrada" }` |
| `500` | `{ "error": "..." }` |

### 6.5 `PATCH /stock/:id`

Actualiza sólo los campos presentes en el body. El repositorio rechaza stock negativo.

**Origen:** [stockController.updateCerveza](../../backEnd/controllers/stockController.js#L64) → [updateCerveza repo](../../backEnd/repository/cervezaRepository.js#L20)

**Request body (cualquier subconjunto):** `nombre`, `tipo`, `stock_actual`, `stock_minimo`, `activo`.

| Código | Cuándo | Body |
|---|---|---|
| `200` | actualizada | `ICerveza` actualizada |
| `400` | falta `:id` | `{ "error": "ID de cerveza requerido" }` |
| `404` | id inexistente | `{ "error": "Cerveza no encontrada" }` |
| `500` | `stock_actual < 0` o `stock_minimo < 0`, u otro error | `{ "error": "El stock_actual no puede ser negativo" }` |

---

## 7. Pedidos — `/pedido`

Rol esperado: **cliente** (crear / ver propios), **admin/empleado** (listar todos / aprobar / rechazar / eliminar).

### 7.1 `POST /pedido`

Crea un pedido en estado `pendiente` y **descuenta stock** de cada cerveza. Lógica de negocio en [pedidoService.createPedido](../../backEnd/services/pedidoService.js#L4).

**Origen:** [pedidoController.createPedido](../../backEnd/controllers/pedidoController.js#L3)

**Request body**

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| `usuario_id` | ObjectId (string) | sí | tomado del body, **no del token** |
| `cervezas` | array | sí | no vacío |
| `cervezas[].cerveza` | ObjectId (string) | sí | debe existir |
| `cervezas[].cantidad` | number | sí | no se valida `> 0` ni entero |

```json
{
  "usuario_id": "665aaa...",
  "cervezas": [
    { "cerveza": "665bbb...", "cantidad": 3 },
    { "cerveza": "665ccc...", "cantidad": 1 }
  ]
}
```

**Lógica:** valida que cada cerveza exista y que `stock_actual >= cantidad`; luego descuenta (`$inc: -cantidad`) y crea el pedido. **No es transaccional** (ver riesgos).

| Código | Cuándo | Body |
|---|---|---|
| `201` | creado | documento `Pedido` (estado `pendiente`) |
| `400` | falta `usuario_id`/`cervezas` o array vacío | `{ "error": "Faltan datos requeridos" }` |
| `400` | ítem sin `cerveza` o `cantidad` | `{ "error": "Cada cerveza debe tener id y cantidad" }` |
| `400` | cerveza inexistente | `{ "error": "Cerveza con ID <id> no encontrada" }` |
| `400` | stock insuficiente | `{ "error": "Stock insuficiente para <nombre>" }` |

```mermaid
sequenceDiagram
    participant FE as Frontend (PedidosService)
    participant API as POST /pedido
    participant SVC as pedidoService
    participant CR as cervezaRepository
    participant PR as pedidoRepository
    FE->>API: { usuario_id, cervezas[] }
    API->>SVC: createPedido(data)
    loop cada item
        SVC->>CR: getCervezaById(item.cerveza)
        alt no existe o stock < cantidad
            SVC-->>API: throw Error
            API-->>FE: 400 { error }
        end
    end
    loop cada item
        SVC->>CR: descontarStockActualById($inc -cantidad)
    end
    SVC->>PR: createPedido(estado="pendiente")
    PR-->>SVC: pedido
    SVC-->>API: pedido
    API-->>FE: 201 pedido
    note over SVC,PR: Sin transacción → posible sobreventa / stock huérfano
```

### 7.2 `GET /pedido`

Lista todos los pedidos (admin/empleado). `Pedido.find().lean()`, **sin `populate`** → `cervezas[].cerveza`, `usuario_id` y `aprobado_por` son sólo ObjectIds.

| Código | Body |
|---|---|
| `200` | `[ Pedido, ... ]` |
| `400` | `{ "error": "..." }` |

### 7.3 `GET /pedido/:id`

| Código | Body |
|---|---|
| `200` | `Pedido` |
| `400` | falta id | `{ "error": "ID de pedido requerido" }` |
| `404` | no encontrado | `{ "error": "Pedido no encontrado" }` |

### 7.4 `GET /pedido/usuario/:usuarioId`

Pedidos de un usuario. **Origen:** [getPedidosByUsuario](../../backEnd/controllers/pedidoController.js#L53).

| Código | Body |
|---|---|
| `200` | `[ Pedido, ... ]` (puede ser `[]`) |
| `400` | `{ "error": "..." }` |

### 7.5 `DELETE /pedido/:id`

Borrado físico. **No restituye stock.**

| Código | Body |
|---|---|
| `200` | `{ "message": "Pedido eliminado correctamente" }` |
| `404` | `{ "error": "Pedido no encontrado" }` |
| `400` | `{ "error": "..." }` |

### 7.6 `PATCH /pedido/:id`

Aprobar / rechazar (o cambiar `aprobado_por`). Sólo se aplican los campos `aprobado_por` y `estado`. Si `estado === 'aprobado'`, se setea `fecha_aprobacion = new Date()`. **No restituye stock al rechazar.**

**Origen:** [pedidoController.updatePedido](../../backEnd/controllers/pedidoController.js#L81) → [updatePedido repo](../../backEnd/repository/pedidoRepository.js#L26)

**Request body**

| Campo | Tipo | Notas |
|---|---|---|
| `estado` | string | debe estar en `['pendiente','aprobado','rechazado']` |
| `aprobado_por` | ObjectId (string) | id del empleado/admin que resuelve |

```json
{ "estado": "aprobado", "aprobado_por": "665ddd..." }
```

| Código | Cuándo | Body |
|---|---|---|
| `200` | actualizado | `Pedido` actualizado |
| `404` | id inexistente | `{ "error": "Pedido no encontrado" }` |
| `400` | `estado` fuera del enum, u otro error | `{ "error": "Estado no válido" }` |

---

## 8. Tabla resumen de endpoints

| Método | Ruta | Acción | Rol esperado | Éxito |
|---|---|---|---|---|
| POST | `/api/auth/register` | Registrar usuario/cliente | público | 201 |
| POST | `/api/auth/login` | Login + JWT | público | 200 |
| GET | `/api/usuarios` | Listar usuarios | admin | 200 |
| POST | `/api/usuarios` | Crear empleado | admin | 200 |
| PATCH | `/api/usuarios/:id` | Activar/desactivar / cambiar rol | admin | 200 |
| GET | `/` | Listar cervezas (catálogo) | público | 200 |
| GET | `/:id` | Cerveza por ID | público | 200 |
| POST | `/stock` | Crear cerveza | admin/empleado | 201 |
| GET | `/stock` | Listar cervezas | admin/empleado | 200 |
| GET | `/stock/:id` | Cerveza por ID | admin/empleado | 200 |
| DELETE | `/stock/:id` | Eliminar cerveza | admin/empleado | 200 |
| PATCH | `/stock/:id` | Modificar cerveza | admin/empleado | 200 |
| POST | `/pedido` | Crear pedido (descuenta stock) | cliente | 201 |
| GET | `/pedido` | Listar todos los pedidos | admin/empleado | 200 |
| GET | `/pedido/:id` | Pedido por ID | admin/empleado/cliente | 200 |
| GET | `/pedido/usuario/:usuarioId` | Pedidos de un usuario | cliente | 200 |
| DELETE | `/pedido/:id` | Eliminar pedido | admin/empleado | 200 |
| PATCH | `/pedido/:id` | Aprobar/rechazar pedido | admin/empleado | 200 |

---

## 9. Consumo desde el frontend

Mapa servicio Angular → endpoint:

| Servicio (`frontEnd/src/services/`) | Cliente HTTP | Endpoints que consume |
|---|---|---|
| [AuthService](../../frontEnd/src/services/authService.ts) | **Axios** | `POST /api/auth/register`, `POST /api/auth/login` |
| [UsuarioService](../../frontEnd/src/services/UsuarioService.ts) | HttpClient | `GET /api/usuarios`, `PATCH /api/usuarios/:id` |
| [CervezaService](../../frontEnd/src/services/cerveza.service.ts) | HttpClient | `GET /`, `GET /:id`, `POST /stock`, `PATCH /stock/:id`, `DELETE /stock/:id` |
| [PedidosService](../../frontEnd/src/services/pedidos.service.ts) | HttpClient | `GET /pedido`, `GET /pedido/:id`, `GET /pedido/usuario/:id`, `POST /pedido`, `PATCH /pedido/:id`, `DELETE /pedido/:id` |

> El frontend guarda el JWT en `localStorage` pero **no lo envía** en `Authorization` en ninguna request. Ver [seguridad](../security/README.md).

---

_Documentación derivada del código. Última verificación de contratos contra `backEnd/` el 2026-06-16._
