# Arquitectura

Documento técnico de la arquitectura del sistema **tpGrupoFrontBack** (cervezas + pedidos).

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
- **Estado de sesión 100% en el cliente**: el JWT se guarda en `localStorage` y se replica un objeto `IUsuario` parcial allí mismo.
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
| cors | 2.8 | CORS (configurado en modo abierto) |
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
HTTP request →  │  routes/             autRoutes, cervezaRoutes,  │
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

| Prefijo | Archivo | Endpoints | Rol esperado* |
|---|---|---|---|
| `/api/auth` | [authRoutes.js](../../backEnd/routes/authRoutes.js) | `POST /register`, `POST /login` | público |
| `/api/usuarios` | [adminUsuarioRoutes.js](../../backEnd/routes/adminUsuarioRoutes.js) | `GET /`, `POST /`, `PATCH /:id` | admin |
| `/stock` | [stockRoutes.js](../../backEnd/routes/stockRoutes.js) | CRUD cervezas | admin / empleado |
| `/pedido` | [pedidoRoutes.js](../../backEnd/routes/pedidoRoutes.js) | CRUD pedidos + `GET /usuario/:id` | cliente (crear), admin / empleado (gestionar) |
| `/` | [cervezaRoutes.js](../../backEnd/routes/cervezaRoutes.js) | `GET /`, `GET /:id` | público (listado para cliente) |

(*) El rol se asume desde el frontend; **el backend no lo valida hoy.**

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

Los guards son **client-side only**. Funcionan como UX para ocultar pantallas, no como autorización real.

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
   │                            │ POST /pedido  {usuario_id,     │                            │
   │                            │   cervezas:[{cerveza,cantidad}]}                            │
   │                            ├───────────────────────────────►│                            │
   │                            │                                │ por cada item:             │
   │                            │                                │   getCervezaById           │
   │                            │                                │   validar stock_actual     │
   │                            │                                │   descontarStock           │
   │                            │                                │ pedido.save(estado=        │
   │                            │                                │   "pendiente")             │
   │                            │                                ├───────────────────────────►│
   │                            │◄───────────────────────────────┤ 201 IPedido                │
   │ feedback "Pedido creado"   │                                │                            │
   │◄───────────────────────────┤                                │                            │
```

> El descuento de stock y la creación del pedido **no son transaccionales**: bug de race condition documentado en el README.

### Flujo 2: Empleado/Admin aprueba pedido

```
[Empleado]   →   GET /pedido                       (lista todos los pedidos)
            →   PATCH /pedido/:id {estado:"aprobado", aprobado_por:<userId>}
                  └─ repository setea fecha_aprobacion = new Date()
```

### Flujo 3: Login

```
POST /api/auth/login {email, password}
  └─ findUserByEmail
     └─ user.activo === false → 404
     └─ bcrypt.compare(password, user.password) → false → 401
     └─ jwt.sign({_id, rol}, SECRET_KEY, {expiresIn:'1h'})
  ← {token, user:{_id, email, nombre, rol, activo}}
```

El frontend guarda `token` y `user` en `localStorage` y emite los `BehaviorSubject` de `AuthService`.

---

## 6. Módulos importantes

### Backend

- **`backEnd/index.js`** — Bootstrap. Conecta a MongoDB, registra middlewares (`cors`, `express.json`) y los routers.
- **`backEnd/services/authService.js`** — Registro + login + emisión JWT. **JWT_SECRET hardcodeado**.
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
| **jsonwebtoken** | Toda la sesión depende de un JWT. Sin él, no hay login. Secret hoy es `"TpCervezas"` — rotarlo invalida todas las sesiones. |
| **bcrypt** | Hash de passwords. Versión 6.x (mayor) cambió internals; downgrades pueden romper validación. |
| **Angular 19 + PrimeNG 19** | UI íntegramente acoplada a PrimeNG (Card, Button, Dialog, Drawer, InputText…). Migrar de versión requiere revisar todos los componentes. |
| **Axios + HttpClient (frontend)** | Dos clientes HTTP coexistiendo. Si se quiere agregar un interceptor (p. ej. para `Authorization`), hay que duplicarlo. |
| **`.env` del backend** | `PORT`, `DB_USER`, `DB_PASSWORD`. Si falta, la app arranca en puerto aleatorio (no hay default) y no conecta a Mongo. |

---

## 8. Riesgos técnicos

### Riesgos de correctitud

1. **Race condition en `createPedido`** — `pedidoService.createPedido` ejecuta validación + descuento + persistencia **sin transacción**. Dos pedidos casi simultáneos sobre la misma cerveza pueden sobrevender stock.
2. **Stock huérfano al rechazar pedido** — el descuento ya ocurrió en la creación; rechazar (`PATCH estado=rechazado`) o eliminar el pedido no devuelve stock.
3. **`ref: 'cervezas'`** en el schema Pedido apunta a un modelo que **no existe** (el modelo se registra como `'Cerveza'`). `populate()` no funcionará correctamente.
4. **Bug en `adminUsuarioService.updateUsuarioService`** ([línea 52](../../backEnd/services/adminUsuarioService.js#L52)): `throw error("...")` — `error` es la variable capturada en `catch`, no es invocable; lanza `TypeError`.
5. **Validaciones falsy en `stockController`** — `if (stock_actual && ...)` ignora `0`, que es un valor legítimo.
6. **`PORT` sin default** — `app.listen(undefined)` escucha en puerto aleatorio si no se carga el `.env`.

### Riesgos operacionales

7. **Sin tests** — cualquier refactor avanza a ciegas.
8. **Sin logger estructurado** — diagnóstico en producción se basa en `console.log` sin niveles.
9. **Sin paginación** — listados de pedidos/cervezas crecen sin techo y se traen completos por request.
10. **Sin manejo central de errores** — cada controller tiene su `try/catch`; los formatos de error varían (`{error}` vs `{message}` vs `{code, message}`).
11. **No hay separación de entornos** — `localhost:3000` está hardcodeado tanto en backend como en frontend.
12. **Cluster MongoDB compartido** — la URI apunta a un cluster fijo; pasar a otro entorno requiere editar `config.js`.

### Riesgos de escalabilidad

13. **`getAllPedidos` sin populate ni proyección** — devuelve todos los pedidos sin paginar; el frontend después tiene que resolver nombres a partir de IDs sueltos.
14. **`getAllUsuariosService`** trae todos los usuarios con password hash incluida.
15. Single point of failure: un solo proceso Node, sin clúster ni PM2.

---

## 9. Problemas de seguridad

> Listado de hallazgos. Severidad subjetiva.

### Críticos

| # | Hallazgo | Ubicación |
|---|---|---|
| **S1** | JWT secret hardcodeado (`"TpCervezas"`) | [authService.js:5](../../backEnd/services/authService.js#L5) |
| **S2** | Ningún endpoint del backend verifica el JWT. `/stock`, `/pedido`, `/api/usuarios` están **públicos**. | Todos los `routes/*` |
| **S3** | Autorización por rol **solo en el frontend** (guards). Un cliente puede llamar `PATCH /api/usuarios/:id` con `{rol:"admin"}` para escalar privilegios. | [adminUsuarioRepository.js:41](../../backEnd/repository/adminUsuarioRepository.js#L41) + ausencia de middleware |
| **S4** | El frontend guarda el JWT pero **no lo envía** en `Authorization`. La sesión existe sólo del lado del cliente; el back no sabe quién está llamando. | servicios del frontend |

### Altos

| # | Hallazgo | Ubicación |
|---|---|---|
| **S5** | CORS abierto a todos los orígenes (`app.use(cors())`) | [index.js:14](../../backEnd/index.js#L14) |
| **S6** | Sin rate limiting en `/api/auth/login` → fuerza bruta posible | [authRoutes.js](../../backEnd/routes/authRoutes.js) |
| **S7** | JWT guardado en `localStorage` → expuesto a XSS | [authService.ts:47-48](../../frontEnd/src/services/authService.ts#L47-L48) |
| **S8** | NoSQL injection: `findUserByEmail({email})` acepta cualquier objeto del request (`{$ne:null}` matchea el primer user) | [userRepository.js:9](../../backEnd/repository/userRepository.js#L9) |
| **S9** | `updateUsuario` y `updateCerveza` aceptan **cualquier campo del body** y lo pasan a `findByIdAndUpdate`. Permite mass-assignment. | adminUsuarioRepository, cervezaRepository |
| **S10** | `createPedido` confía en `usuario_id` que viene en el body — un cliente puede crear pedidos a nombre de otro usuario | [pedidoController.js:5](../../backEnd/controllers/pedidoController.js#L5) |

### Medios

| # | Hallazgo |
|---|---|
| **S11** | Password en plano logueada antes del hash en `createEmpleadoService` |
| **S12** | Sin validación de complejidad/longitud de password en register |
| **S13** | bcrypt con `saltRounds=10` (default; aceptable pero se recomienda ≥12 en 2026) |
| **S14** | `expiresIn: '1h'` razonable, pero no hay refresh tokens ni revocación |
| **S15** | Mensajes de error revelan si el email existe (`Usuario no encontrado` vs `Contraseña incorrecta`) → enumeración de usuarios |
| **S16** | Stack traces y mensajes de error de Mongoose se reenvían tal cual al cliente (`error.message`) |
| **S17** | Sin headers de seguridad (`helmet` no está instalado): no hay CSP, HSTS, X-Frame-Options, etc. |
| **S18** | `getAllUsuariosService` retorna el campo `password` (hash) en cada usuario |

### Bajos

| # | Hallazgo |
|---|---|
| **S19** | El navegador del cliente confía en `user` deserializado desde `localStorage` para decidir permisos. Manipulable. |
| **S20** | `console.log` con datos del request (incluyendo IDs y bodies) en repositorios. |

---

## 10. Próximos pasos recomendados (orden sugerido)

1. **Cerrar S1–S4 en una sola PR**: secret a `.env`, middleware `verifyToken` + `requireRole`, interceptor de `Authorization` en el front, derivar `usuario_id` del token en `createPedido`.
2. Whitelist de campos en `updateUsuario`/`updateCerveza` (sólo lo permitido).
3. Transacción Mongo en `createPedido` + restitución de stock al rechazar.
4. Validación con Zod o Joi en todos los endpoints + middleware central de errores.
5. Tests con Jest + supertest, al menos de auth, stock y pedido.
6. Logger estructurado y eliminación de `console.*`.
