# Arquitectura

Documento técnico de la arquitectura del sistema **tpGrupoFrontBack** (cervezas + pedidos).

> **Última actualización:** 2026-06-17. Incorpora las correcciones de seguridad y correctitud del commit `5f8172e` (autenticación/autorización en el backend, descuento atómico de stock con rollback, whitelist de campos, CORS restringido, secret por entorno, etc.). Los hallazgos resueltos quedan marcados con ✅ y los pendientes se mantienen.

---

## 1. Arquitectura general

Aplicación cliente/servidor clásica de tres capas físicas:

```
┌──────────────────────┐      HTTP/JSON       ┌──────────────────────┐      MongoDB Wire     ┌─────────────────┐
│   Frontend Angular   │ ───────────────────► │   Backend Express    │ ────────────────────► │  MongoDB Atlas  │
│   (SPA, puerto 4200) │   axios / HttpClient │   (REST, puerto 3000)│      Mongoose ODM     │  (cluster cloud)│
└──────────────────────┘                      └──────────────────────┘                       └─────────────────┘
        │                                              │
        │  localStorage: token + user                  │  .env: DB_USER, DB_PASSWORD, PORT
        │  guards canActivate (cliente-side)           │  bcrypt para passwords, JWT para sesiones
```

- **Sin gateway, sin balanceador, sin cache.** Un único proceso Node sirve la API.
- **Sesión con JWT validado en el backend**: el front guarda el JWT en `localStorage` y lo envía en `Authorization: Bearer`; el backend lo verifica y deriva `{ _id, rol }` del token (middleware `verifyToken`). Se mantiene una copia parcial de `IUsuario` en `localStorage` solo para UX.
- **Acoplamiento por URL**: el front asume `http://localhost:3000` hardcodeado en cada `Service`.

---

## 2. Tecnologías

### Backend
| Componente | Versión | Uso |
|---|---|---|
| Node.js + Express | 5.1 | Servidor HTTP y router |
| Mongoose | 8.15 | Modelado y acceso a MongoDB |
| MongoDB Atlas | cloud | Persistencia |
| jsonwebtoken | 9.0 | Emisión de JWT en login |
| bcrypt | 6.0 | Hash de passwords |
| dotenv | 16.5 | Carga de variables de entorno |
| cors | 2.8 | CORS (restringido a `localhost`, commit 5f8172e) |
| nodemon | 3.1 (dev) | Hot reload |

### Frontend
| Componente | Versión | Uso |
|---|---|---|
| Angular | 19.2 | Framework SPA (standalone components) |
| PrimeNG + Aura | 19.1 | Biblioteca UI |
| TailwindCSS | 4.1 | Utilidades de estilo |
| Axios | 1.9 | HTTP en `AuthService` |
| HttpClient | (Angular) | HTTP en el resto de servicios |
| RxJS | 7.8 | Observables + `BehaviorSubject` para estado de sesión |
| TypeScript | 5.7 | Lenguaje |

---

## 3. Arquitectura del backend (capas)

```
                ┌─────────────────────────────────────────────────┐
HTTP request →  │  middlewares/        verifyToken (JWT) +        │
                │                      requireRole (autorización) │
                ├─────────────────────────────────────────────────┤
                │  routes/             autRoutes, cervezaRoutes,  │
                │                      stockRoutes, pedidoRoutes, │
                │                      adminUsuarioRoutes         │
                ├─────────────────────────────────────────────────┤
                │  controllers/        Validación HTTP, manejo de │
                │                      status codes y JSON        │
                ├─────────────────────────────────────────────────┤
                │  services/           Reglas de negocio          │
                │                      (auth, pedidos, stock…)    │
                ├─────────────────────────────────────────────────┤
                │  repository/         Acceso a Mongoose          │
                │                      (find, save, update…)      │
                ├─────────────────────────────────────────────────┤
                │  models/             Schemas Mongoose           │
                │                      (Usuario, Cerveza, Pedido) │
                └─────────────────────────────────────────────────┘
                                  │
                                  ▼
                          MongoDB Atlas
```

La separación está prolijamente respetada en todos los módulos (auth, cerveza/stock, pedido, adminUsuario). El controller nunca llama directamente a Mongoose, y el service nunca arma respuestas HTTP.

### Mapa de rutas

| Prefijo | Archivo | Endpoints | Autenticación / Rol exigido por el backend* |
|---|---|---|---|
| `/api/auth` | [authRoutes.js](../../backEnd/routes/authRoutes.js) | `POST /register`, `POST /login` | público (sin token) |
| `/api/usuarios` | [adminUsuarioRoutes.js](../../backEnd/routes/adminUsuarioRoutes.js) | `GET /`, `POST /`, `PATCH /:id` | JWT + `admin` |
| `/stock` | [stockRoutes.js](../../backEnd/routes/stockRoutes.js) | CRUD cervezas | JWT + `admin` / `empleado` (todas las rutas) |
| `/pedido` | [pedidoRoutes.js](../../backEnd/routes/pedidoRoutes.js) | `POST /`, `GET /`, `GET /:id`, `GET /usuario/:id`, `PATCH /:id`, `DELETE /:id` | JWT obligatorio. `POST /` → `cliente`; `GET /` (todos), `PATCH /:id`, `DELETE /:id` → `admin` / `empleado`; `GET /:id` y `GET /usuario/:id` → cualquier rol autenticado |
| `/` | [cervezaRoutes.js](../../backEnd/routes/cervezaRoutes.js) | `GET /`, `GET /:id` | JWT (cualquier rol autenticado) |

(*) ✅ Corregido (commit 5f8172e). El backend ahora valida el JWT y los roles vía los middlewares `verifyToken` / `requireRole` ([backEnd/middlewares/auth.js](../../backEnd/middlewares/auth.js)). Todas las rutas exigen token salvo `/api/auth/register` y `/api/auth/login`. Los guards del frontend pasan a ser solo UX; la autorización real es del backend.

---

## 4. Arquitectura del frontend

```
   app.component (root)
        │
        ├── NavbarComponent  (visible según AuthService.isLoggedIn$)
        │
        └── LayoutComponent  (router-outlet)
                │
                ├── HomeComponent          (AuthGuard)
                ├── LoginComponent         (GuestGuard)
                ├── RegisterComponent      (GuestGuard | AdminGuard según ruta)
                │
                ├── CervezasComponent      (Auth + Role[admin,empleado])
                ├── CervezaFormComponent   (Auth + Role[admin,empleado])
                ├── AdministrarPedidos     (Auth + Role[admin,empleado])
                │
                ├── PedidosComponent       (Auth + ClienteGuard)
                ├── MisPedidosComponent    (Auth + ClienteGuard)
                │
                ├── AdminHomeComponent     (Auth + AdminGuard)
                ├── AdminDashboard         (Auth + AdminGuard)
                └── RegisterComponent      [reusado en /admin/crear-empleado]
```

### Servicios (`frontEnd/src/services/`)
- **AuthService** — Singleton. Maneja login/register/logout, persiste `token` y `user` en localStorage, expone `isLoggedIn$` y `user$` como `BehaviorSubject`. Único servicio que usa `axios`.
- **UsuarioService** — CRUD admin de usuarios (`GET /api/usuarios`, `PATCH /api/usuarios/:id`).
- **CervezaService** — CRUD de cervezas (mezcla rutas `/` y `/stock`).
- **PedidosService** — CRUD de pedidos (cliente + admin).

### Guards (`frontEnd/src/app/guards/`)
- `AuthGuard` — redirige a `/login` si no hay token.
- `GuestGuard` — redirige a `/` si ya hay token.
- `AdminGuard` / `EmpleadoGuard` / `ClienteGuard` — chequean `user.rol`.
- `RoleGuard` — versión genérica que lee `route.data.roles`.

Los guards son **client-side only**. Funcionan como UX para ocultar pantallas; la autorización real ahora la impone el backend (`verifyToken` + `requireRole`, commit 5f8172e). La migración a React (`frontReact/`) envía el `Authorization: Bearer` mediante un interceptor de Axios ([frontReact/src/services/http.ts](../../frontReact/src/services/http.ts)) que además hace `logout` ante un `401`. El front Angular viejo quedó intencionalmente roto (no manda token).

---

## 5. Flujo principal del sistema

### Flujo 1: Cliente crea un pedido

```
[Cliente]                  [Front Angular]                 [Backend Express]              [MongoDB]
   │                            │                                │                            │
   │ navega a /pedidos          │                                │                            │
   ├───────────────────────────►│                                │                            │
   │                            │ GET /  (listar cervezas)       │                            │
   │                            ├───────────────────────────────►│                            │
   │                            │                                │ Cerveza.find()             │
   │                            │                                ├───────────────────────────►│
   │                            │                                │◄───────────────────────────┤
   │                            │◄───────────────────────────────┤ 200 [ICerveza]             │
   │                            │                                │                            │
   │ arma carrito + click       │                                │                            │
   ├───────────────────────────►│                                │                            │
   │                            │ POST /pedido  (Bearer token)   │                            │
   │                            │   {cervezas:[{cerveza,cantidad}]}                           │
   │                            ├───────────────────────────────►│                            │
   │                            │                                │ verifyToken → req.user._id │
   │                            │                                │ requireRole('cliente')     │
   │                            │                                │ usuario_id = token (no body)│
   │                            │                                │ validar cantidad entero > 0│
   │                            │                                │ por cada item:             │
   │                            │                                │   descuento atómico $gte   │
   │                            │                                │   (rollback si falta stock)│
   │                            │                                │ pedido.save(estado=        │
   │                            │                                │   "pendiente")             │
   │                            │                                ├───────────────────────────►│
   │                            │◄───────────────────────────────┤ 201 IPedido                │
   │ feedback "Pedido creado"   │                                │                            │
   │◄───────────────────────────┤                                │                            │
```

> ✅ Corregido (commit 5f8172e): el `usuario_id` se toma del token (no del body) y la cantidad se valida como entero > 0. El descuento de stock usa una actualización **atómica condicional** (`$gte`) con **rollback** de los ítems ya descontados si alguno falla, lo que mitiga la race condition / sobreventa que antes documentaba el README. Nota: aún **no** hay transacción multi-documento real (es descuento atómico por ítem + compensación manual), ver §8.

### Flujo 2: Empleado/Admin aprueba pedido

```
[Empleado]   →   GET /pedido                       (lista todos los pedidos)
            →   PATCH /pedido/:id {estado:"aprobado", aprobado_por:<userId>}
                  └─ repository setea fecha_aprobacion = new Date()
```

### Flujo 3: Login

```
POST /api/auth/login {email, password}
  └─ findUserByEmail (email coercionado a string → previene NoSQL injection)
     └─ user.activo === false → 404
     └─ bcrypt.compare(password, user.password) → false → 401
     └─ jwt.sign({_id, rol}, SECRET_KEY=process.env.JWT_SECRET, {expiresIn:'1h'})
  ← {token, user:{_id, email, nombre, rol, activo}}
```

✅ Corregido (commit 5f8172e): el login ahora respeta `error.status` y devuelve `401`/`404` según corresponda (antes siempre respondía `500`). El frontend guarda `token` y `user` en `localStorage` y emite los `BehaviorSubject` de `AuthService`. En la app React el token viaja en cada request vía interceptor de Axios.

---

## 6. Módulos importantes

### Backend

- **`backEnd/index.js`** — Bootstrap. Conecta a MongoDB, registra middlewares (`cors` restringido a `localhost`, `express.json`) y los routers.
- **`backEnd/middlewares/auth.js`** — `verifyToken` (valida `Authorization: Bearer`, deja `{ _id, rol }` en `req.user`) y `requireRole(...roles)` (autorización por rol). Lee el secret de `process.env.JWT_SECRET`.
- **`backEnd/services/authService.js`** — Registro + login + emisión JWT. ✅ El secret ahora se toma de `process.env.JWT_SECRET` (commit 5f8172e), ya no está hardcodeado en el código.
- **`backEnd/services/pedidoService.js`** — Único service con lógica de negocio compuesta (validación de stock + descuento + creación).
- **`backEnd/models/Pedido.js`** — Modelo con `estado` enum (`pendiente|aprobado|rechazado`) y `cervezas[]` embebido.

### Frontend

- **`frontEnd/src/services/authService.ts`** — Único punto de verdad de la sesión. Lee/escribe localStorage y mantiene `BehaviorSubject`.
- **`frontEnd/src/app/app.routes.ts`** — Todas las rutas + guards aplicados.
- **`frontEnd/src/app/components/pedidos/pedidos.component.ts`** — Vista principal del cliente, arma el carrito en memoria y dispara `createPedido`.
- **`frontEnd/src/app/components/stock/administrar-pedidos/`** — Vista de gestión de pedidos para empleado/admin.

---

## 7. Dependencias críticas

| Dependencia | Por qué es crítica |
|---|---|
| **MongoDB Atlas** | Único almacén de datos. Caída del cluster = caída total. URI hardcodeada al cluster `cluster0.zbfn2s4`. |
| **jsonwebtoken** | Toda la sesión depende de un JWT. Sin él, no hay login. El secret ahora se lee de `process.env.JWT_SECRET` — rotarlo invalida todas las sesiones. |
| **bcrypt** | Hash de passwords. Versión 6.x (mayor) cambió internals; downgrades pueden romper validación. |
| **Angular 19 + PrimeNG 19** | UI íntegramente acoplada a PrimeNG (Card, Button, Dialog, Drawer, InputText…). Migrar de versión requiere revisar todos los componentes. |
| **Axios + HttpClient (frontend)** | Dos clientes HTTP coexistiendo en el front Angular. La migración a React (`frontReact/`) unifica en Axios con un interceptor único que adjunta `Authorization: Bearer` ([frontReact/src/services/http.ts](../../frontReact/src/services/http.ts)). |
| **`.env` del backend** | `PORT` (default `3000` si falta), `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`. Sin credenciales de Mongo no conecta a la base. |

---

## 8. Riesgos técnicos

### Riesgos de correctitud

1. ✅ **Corregido (commit 5f8172e) — Race condition en `createPedido`** — el descuento ahora es **atómico condicional** (`$gte`) con **rollback** de los ítems ya descontados si alguno falla, lo que mitiga la sobreventa de stock. (Ver §13 para la limitación residual: no es una transacción multi-documento real.)
2. ✅ **Corregido (commit 5f8172e) — Stock huérfano al rechazar/eliminar pedido** — `updatePedido` restituye el stock al pasar a `rechazado` (y lo vuelve a reservar si se reactiva), y `deletePedidoById` restituye el stock de los pedidos que lo tenían reservado.
3. ✅ **Corregido (commit 5f8172e) — `ref` del schema Pedido** — el `ref` ahora apunta a `'Cerveza'` (el nombre real del modelo), por lo que `populate()` ya es posible. *Pendiente:* las queries de pedido todavía **no llaman** a `populate` (ver §13).
4. ✅ **Corregido (commit 5f8172e) — `adminUsuarioService.updateUsuarioService`** — se eliminó el `throw error("...")` que lanzaba un `TypeError`; ahora propaga el error correctamente y aplica una **whitelist de campos**.
5. ✅ **Corregido (commit 5f8172e) — Validaciones falsy en `stockController`** — el controller ahora distingue correctamente `0`/`false` de valores ausentes.
6. ✅ **Corregido (commit 5f8172e) — `PORT` sin default** — ahora hay un default de `3000` si no se carga el `.env`.

### Riesgos operacionales

7. **Sin tests** — cualquier refactor avanza a ciegas.
8. **Sin logger estructurado** — diagnóstico en producción se basa en `console.log` sin niveles.
9. **Sin paginación** — listados de pedidos/cervezas crecen sin techo y se traen completos por request.
10. **Sin manejo central de errores** — cada controller tiene su `try/catch`; los formatos de error varían (`{error}` vs `{message}` vs `{code, message}`).
11. **No hay separación de entornos** — `localhost:3000` está hardcodeado tanto en backend como en frontend.
12. **Cluster MongoDB compartido** — la URI apunta a un cluster fijo; pasar a otro entorno requiere editar `config.js`.

### Riesgos de escalabilidad

13. **`getAllPedidos` sin populate ni proyección** *(pendiente)* — devuelve todos los pedidos sin paginar; el frontend después tiene que resolver nombres a partir de IDs sueltos. El `ref` del schema ya quedó corregido (§ riesgo 3), pero las queries todavía **no invocan** `populate`.
14. ✅ **Corregido (commit 5f8172e) — `getAllUsuariosService`** — ahora excluye el campo `password` de la respuesta.
15. Single point of failure *(pendiente)*: un solo proceso Node, sin clúster ni PM2.

---

## 9. Problemas de seguridad

> Listado de hallazgos. Severidad subjetiva.

### Críticos

| # | Hallazgo | Ubicación | Estado |
|---|---|---|---|
| **S1** | JWT secret hardcodeado (`"TpCervezas"`) → ahora se lee de `process.env.JWT_SECRET`. | [middlewares/auth.js:4](../../backEnd/middlewares/auth.js#L4), authService.js | ✅ Corregido (commit 5f8172e) |
| **S2** | Ningún endpoint del backend verificaba el JWT (`/stock`, `/pedido`, `/api/usuarios` públicos) → ahora `verifyToken` protege todas las rutas salvo `/api/auth/register` y `/api/auth/login`. | [middlewares/auth.js](../../backEnd/middlewares/auth.js), todos los `routes/*` | ✅ Corregido (commit 5f8172e) |
| **S3** | Autorización por rol solo en el frontend → ahora `requireRole` valida el rol en el backend por endpoint (ver Mapa de rutas §3). Escalar privilegios vía `PATCH /api/usuarios/:id` ya no es posible sin rol `admin`. | [middlewares/auth.js:25](../../backEnd/middlewares/auth.js#L25), routes/* | ✅ Corregido (commit 5f8172e) |
| **S4** | El frontend guardaba el JWT pero no lo enviaba → la app React lo envía en `Authorization: Bearer` vía interceptor de Axios (401 → logout). | [frontReact/src/services/http.ts](../../frontReact/src/services/http.ts) | ✅ Corregido (commit 5f8172e) |

### Altos

| # | Hallazgo | Ubicación | Estado |
|---|---|---|---|
| **S5** | CORS abierto a todos los orígenes (`app.use(cors())`) → restringido a `localhost`. | [index.js](../../backEnd/index.js) | ✅ Corregido (commit 5f8172e) |
| **S6** | Sin rate limiting en `/api/auth/login` → fuerza bruta posible | [authRoutes.js](../../backEnd/routes/authRoutes.js) | ⏳ Pendiente |
| **S7** | JWT guardado en `localStorage` → expuesto a XSS | servicios del frontend | ⏳ Pendiente |
| **S8** | NoSQL injection: `findUserByEmail({email})` aceptaba cualquier objeto del request (`{$ne:null}`) → ahora el `email` se coerciona a `string` antes de la query. | [userRepository.js](../../backEnd/repository/userRepository.js) | ✅ Corregido (commit 5f8172e) |
| **S9** | `updateUsuario` permitía mass-assignment → ahora aplica **whitelist de campos**. *(El `updateCerveza`/stock sigue sin whitelist explícita; revisar.)* | adminUsuarioService | ✅ Corregido para usuarios (commit 5f8172e) |
| **S10** | `createPedido` confiaba en `usuario_id` del body → ahora se deriva del token (`req.user._id`); un cliente ya no puede crear pedidos a nombre de otro. | [pedidoController.js](../../backEnd/controllers/pedidoController.js) | ✅ Corregido (commit 5f8172e) |

### Medios

| # | Hallazgo | Estado |
|---|---|---|
| **S11** | Password en plano logueada antes del hash en `createEmpleadoService` → se quitaron los logs que filtraban password/datos. | ✅ Corregido (commit 5f8172e) |
| **S12** | Sin validación de complejidad/longitud de password en register | ⏳ Pendiente |
| **S13** | bcrypt con `saltRounds=10` (default; aceptable pero se recomienda ≥12 en 2026) | ⏳ Pendiente |
| **S14** | `expiresIn: '1h'` razonable, pero no hay refresh tokens ni revocación | ⏳ Pendiente |
| **S15** | Mensajes de error revelan si el email existe (`Usuario no encontrado` vs `Contraseña incorrecta`) → enumeración de usuarios | ⏳ Pendiente |
| **S16** | Stack traces y mensajes de error de Mongoose se reenvían tal cual al cliente (`error.message`) | ⏳ Pendiente |
| **S17** | Sin headers de seguridad (`helmet` no está instalado): no hay CSP, HSTS, X-Frame-Options, etc. | ⏳ Pendiente |
| **S18** | `getAllUsuariosService` retornaba el campo `password` (hash) → ahora se excluye. | ✅ Corregido (commit 5f8172e) |

### Bajos

| # | Hallazgo | Estado |
|---|---|---|
| **S19** | El navegador del cliente confía en `user` deserializado desde `localStorage` para decidir permisos (UX). Manipulable — pero la autorización real ya la impone el backend (S2/S3). El JWT en `localStorage` sigue expuesto a XSS (ver S7). | ⏳ Pendiente |
| **S20** | `console.log` con datos del request (incluyendo IDs y bodies) en repositorios → se quitaron los logs sensibles. | ✅ Corregido (commit 5f8172e) |

---

## 10. Próximos pasos recomendados (orden sugerido)

1. ✅ **Hecho (commit 5f8172e) — S1–S4**: secret en `process.env.JWT_SECRET`, middleware `verifyToken` + `requireRole`, interceptor de `Authorization` en el front React, y `usuario_id` derivado del token en `createPedido`.
2. **Whitelist de campos**: ya aplicada en `updateUsuario` ✅ (commit 5f8172e). **Pendiente:** replicarla en `updateCerveza`/stock.
3. **Transacción Mongo real en `createPedido`** *(pendiente)*: hoy hay descuento atómico por ítem (`$gte`) + rollback manual y restitución de stock al rechazar/eliminar ✅, pero no una transacción multi-documento.
4. Validación con Zod o Joi en todos los endpoints + middleware central de errores *(pendiente)*. Incluye no reenviar mensajes de Mongoose al cliente (S16) y evitar enumeración de usuarios (S15).
5. Tests con Jest + supertest, al menos de auth, stock y pedido *(pendiente; sin tests ni CI/CD)*.
6. Logger estructurado y eliminación de `console.*` *(pendiente; ya se quitaron los logs sensibles — S11/S20)*.
7. Endurecimiento adicional *(pendiente)*: `helmet` (S17), rate limiting en login (S6), `saltRounds ≥ 12` (S13), refresh tokens/revocación (S14), paginación de listados, `populate` en queries de pedido, filtrar cervezas `activo:false` del catálogo, y mover la URI de Mongo fuera de `config.js`.
