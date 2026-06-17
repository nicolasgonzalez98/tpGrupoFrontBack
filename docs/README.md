# tpGrupoFrontBack — Sistema de Gestión de Cervezas y Pedidos

> **Última actualización / verificación:** 2026-06-17 (commit `5f8172e`)

Trabajo práctico que implementa un sistema de gestión de stock de cervezas y pedidos con tres roles diferenciados (cliente, empleado, admin). Compuesto por un backend REST en Node.js/Express y un frontend. El frontend Angular 19 original (`frontEnd/`) está siendo migrado a React (`frontReact/`); el cliente React es el que se mantiene actualizado y el que integra correctamente con la nueva autenticación del backend.

> Documentación complementaria:
> - [Arquitectura](architecture/ARCHITECTURE.md)
> - [Reglas de negocio](business/BUSINESS_RULES.md)
> - [API / Endpoints](api/README.md)
> - [Modelo de datos](database/README.md)
> - [Seguridad](security/README.md)

---

## Stack tecnológico

### Backend
- **Runtime:** Node.js
- **Framework:** Express 5
- **ORM/ODM:** Mongoose 8
- **Base de datos:** MongoDB Atlas (cluster cloud)
- **Autenticación:** JSON Web Tokens (jsonwebtoken 9) + bcrypt 6
- **Autorización:** middleware propio `verifyToken` + `requireRole` ([backEnd/middlewares/auth.js](../backEnd/middlewares/auth.js)) — verifica el JWT y el rol en **el backend** para todas las rutas salvo `/api/auth/register` y `/api/auth/login`
- **Configuración:** dotenv 16
- **CORS:** cors 2.8 (restringido a orígenes `localhost`)
- **Dev:** nodemon 3

### Frontend (React — actual)
- **Framework:** React (`frontReact/`)
- **HTTP:** Axios con interceptor global ([frontReact/src/services/http.ts](../frontReact/src/services/http.ts)) que adjunta `Authorization: Bearer <token>` y cierra sesión ante un 401
- **Config:** constante `API_URL` centralizada

### Frontend (Angular 19 — legado, en reemplazo)
- **Framework:** Angular 19 (standalone components)
- **UI:** PrimeNG 19 + tema Aura + PrimeIcons
- **Estilos:** TailwindCSS 4
- **HTTP:** `@angular/common/http` (HttpClient) + Axios 1.9 (en AuthService)
- **Reactividad:** RxJS 7.8 + Zone.js
- **Tooling:** Angular CLI 19 + TypeScript 5.7
- **Nota:** quedó intencionalmente roto contra el backend nuevo (no envía el token en `Authorization`); se reemplaza por la versión React.

### Testing
- Backend: **no hay tests automatizados** (solo archivos `.http` para REST Client).
- Frontend: Karma + Jasmine configurados pero **sin specs implementadas**.

---

## Estructura del repositorio

```
tpGrupoFrontBack/
├── backEnd/                 Servidor Express + MongoDB
│   ├── controllers/         Adaptan HTTP → service
│   ├── services/            Lógica de negocio
│   ├── repository/          Acceso a datos (Mongoose)
│   ├── models/              Schemas Mongoose
│   ├── routes/              Definición de endpoints
│   ├── database/            Conexión + URI
│   ├── test/                Requests HTTP manuales
│   └── index.js             Entry point
├── frontEnd/                SPA Angular 19 (legado, en reemplazo)
│   └── src/
│       ├── app/
│       │   ├── components/  Vistas (login, register, stock, pedidos, admin…)
│       │   ├── guards/      Auth/Guest/Role/Admin/Empleado/Cliente
│       │   ├── models/      Interfaces TS (IUsuario, ICerveza, IPedido…)
│       │   ├── layout/      Layout principal + navbar
│       │   └── app.routes.ts
│       └── services/        AuthService, UsuarioService, CervezaService, PedidosService
├── frontReact/              SPA React (frontend actual)
│   └── src/
│       └── services/        Cliente Axios con interceptor de auth (http.ts)
├── docs/                    Documentación (este directorio)
│   ├── architecture/
│   ├── business/
│   ├── database/
│   └── security/
└── prompts/                 Prompts utilizados
```

---

## Setup

### 1. Variables de entorno (backEnd/.env)

```env
PORT=3000
DB_USER=<usuario_mongo_atlas>
DB_PASSWORD=<password_mongo_atlas>
JWT_SECRET=<secreto_para_firmar_jwt>
```

> El secreto del JWT se lee de `process.env.JWT_SECRET` (con fallback `'TpCervezas'` si no está definido). En producción definí siempre `JWT_SECRET`.
> El cluster (host) sigue hardcodeado en [backEnd/database/config.js](../backEnd/database/config.js) (`cluster0.zbfn2s4.mongodb.net`). Para usar otra instancia hay que editar el archivo.

### 2. Instalación

```bash
# Backend
cd backEnd
npm install
npm run dev          # nodemon (recarga en cambios)
# o
npm start            # producción

# Frontend (en otra terminal)
cd frontEnd
npm install
npm start            # ng serve en http://localhost:4200
```

Backend escucha en `http://localhost:3000` (o el `PORT` del `.env`; default `3000`).
El frontend React centraliza la base del backend en una constante `API_URL`. El frontend Angular legado todavía tiene la URL `http://localhost:3000` hardcodeada en los servicios.

---

## Resumen técnico

| Aspecto | Estado |
|---|---|
| Arquitectura backend | 4 capas (route → controller → service → repository) bien separadas |
| Arquitectura frontend | React (`frontReact/`) con cliente Axios + interceptor de auth; Angular legado con standalone components + guards por rol |
| Persistencia | MongoDB Atlas vía Mongoose. Sin transacciones multi-documento, pero el descuento de stock es atómico por ítem con rollback |
| Autenticación | JWT firmado (secret en `JWT_SECRET`), password con bcrypt (10 rounds) |
| Autorización | **Verificada en el backend** vía `verifyToken` + `requireRole` en todas las rutas salvo `/api/auth/*`. El frontend además tiene guards por rol |
| Validación de entrada | Validación de tipos en controllers (incluye `cantidad` entera > 0, tipos de stock con `!== undefined`) + whitelist de campos en update de usuario. Sin schema validator (Joi/Zod) |
| Manejo de errores | Catch local en cada controller; el login/register mapean `error.status` (401/404/409). Sin middleware central |
| Logging | `console.log/error` (ya no se loguean passwords ni datos sensibles de usuarios) |
| Tests | No hay |
| CI/CD | No hay |
| Documentación | Sólo este conjunto de docs |

El stack es coherente y la separación en capas del backend es limpia. Tras el commit `5f8172e`, la autorización se verifica en el backend (JWT + roles) y se cerraron los principales bugs de seguridad. Las debilidades restantes son sobre todo la **ausencia de tests/CI** y endurecimientos pendientes (rate-limiting, helmet, bcrypt rounds, secrets/host del cluster).

---

## Deuda técnica

### Corregido (commit `5f8172e`)

1. ✅ **(Corregido — commit 5f8172e)** **JWT secret ya no hardcodeado suelto.** Tanto [authService.js:5](../backEnd/services/authService.js#L5) como el middleware leen el secret de `process.env.JWT_SECRET` (con fallback `'TpCervezas'`). _Pendiente menor: el fallback sigue existiendo._
2. ✅ **(Corregido — commit 5f8172e)** **El backend ahora verifica el JWT en todas las rutas** salvo `/api/auth/register` y `/api/auth/login`. Se agregó [backEnd/middlewares/auth.js](../backEnd/middlewares/auth.js) con `verifyToken` + `requireRole`, aplicados por router: `/api/usuarios` → admin; `/stock/*` → admin|empleado; `POST /pedido` → cliente; `GET /pedido`, `PATCH /pedido/:id`, `DELETE /pedido/:id` → admin|empleado; `GET /pedido/:id` y `GET /pedido/usuario/:id` → cualquier rol autenticado; catálogo de cervezas (`GET /`, `GET /:id`) → cualquier rol autenticado.
3. ✅ **(Corregido — commit 5f8172e)** **La autorización ya no depende solo de guards del frontend.** Un cliente HTTP (Postman, curl) sin token válido recibe 401/403 del backend. El frontend React envía el token vía interceptor de Axios ([frontReact/src/services/http.ts](../frontReact/src/services/http.ts)).
4. ✅ **(Corregido — commit 5f8172e)** **`adminUsuarioService.updateUsuarioService`**: se eliminó el `throw error(...)` que lanzaba `TypeError`. Además se agregó una whitelist de campos (`nombre`, `email`, `rol`, `activo`) que evita mass-assignment ([adminUsuarioService.js:40-49](../backEnd/services/adminUsuarioService.js#L40-L49)).
5. ✅ **(Corregido — commit 5f8172e)** **`PORT` con default `3000`** ([index.js:5](../backEnd/index.js#L5)): `const port = process.env.PORT || 3000`.
6. ✅ **(Corregido — commit 5f8172e)** **Race condition en creación de pedido mitigada**: el stock se descuenta de forma atómica y condicional por ítem (`findOneAndUpdate` con `stock_actual $gte`), con rollback de los descuentos previos si alguno falla ([pedidoService.js:15-39](../backEnd/services/pedidoService.js#L15-L39)). Evita la sobreventa por concurrencia. _Nota: no es una transacción multi-documento real (ver pendientes)._
7. ✅ **(Corregido — commit 5f8172e)** **Se restituye el stock al rechazar o eliminar un pedido** que tenía stock reservado ([pedidoService.js:53-93](../backEnd/services/pedidoService.js#L53-L93)).
8. ✅ **(Corregido — commit 5f8172e)** **`ref` del schema corregido**: `Pedido.cervezas[].cerveza` ahora referencia `'Cerveza'` ([Pedido.js:11](../backEnd/models/Pedido.js#L11)). El `populate()` ya funcionaría (aunque todavía no se invoca; ver pendientes).
9. ✅ **(Corregido — commit 5f8172e)** **CORS restringido** a orígenes `localhost` vía regex (`/^http:\/\/localhost:\d+$/`) en [index.js:15](../backEnd/index.js#L15). Ya no está abierto a todos.
10. ✅ **(Corregido — commit 5f8172e)** **`createPedido` toma `usuario_id` del token** (`req.user._id`), no del body, y valida que `cantidad` sea entero `> 0` ([pedidoController.js:7-17](../backEnd/controllers/pedidoController.js#L7-L17)).
11. ✅ **(Corregido — commit 5f8172e)** **Bug de falsy en validaciones de stock corregido**: `stockController.createCerveza` usa `if (stock_actual !== undefined && typeof stock_actual !== "number")` ([stockController.js:13-21](../backEnd/controllers/stockController.js#L13-L21)). `stock_actual = 0` y `activo = false` ahora se validan bien.
12. ✅ **(Corregido — commit 5f8172e)** **`updateUsuario` ya no acepta cualquier campo del body**: el service filtra contra la whitelist `nombre/email/rol/activo` (ver punto 4), y además el endpoint quedó protegido con `requireRole('admin')`.
13. ✅ **(Corregido — commit 5f8172e)** **No se exponen datos sensibles en logs**: se quitaron los logs que filtraban password/datos de usuarios.
14. ✅ **(Corregido — commit 5f8172e)** **`getAllUsuarios` excluye el hash de password** (`.select('-password')` en [adminUsuarioRepository.js:17](../backEnd/repository/adminUsuarioRepository.js#L17)).
15. ✅ **(Corregido — commit 5f8172e)** **`login` mapea el status correcto**: usa `res.status(error.status || 500)` → devuelve 401/404 según corresponda ([authController.js:17](../backEnd/controllers/authController.js#L17)). Antes siempre devolvía 500.
16. ✅ **(Corregido — commit 5f8172e)** **NoSQL injection en login mitigada**: `findUserByEmail` coerciona `email` a string ([userRepository.js:10](../backEnd/repository/userRepository.js#L10)).
17. ✅ **(Corregido — commit 5f8172e)** **El frontend React ahora envía el token al backend** (`Authorization: Bearer <token>` vía interceptor de Axios) y cierra sesión ante un 401. _El frontend Angular legado quedó intencionalmente roto contra el backend nuevo._

### Pendientes / críticos

1. **JWT en `localStorage`** en el frontend — expuesto a XSS. Mejor `httpOnly cookie`.
2. **Sin rate limiting** en `/api/auth/login` → expuesto a fuerza bruta (falta `express-rate-limit`).
3. **Sin `helmet`/headers de seguridad.**
4. **Fallback del `JWT_SECRET`** (`'TpCervezas'`) sigue presente: si no se define `JWT_SECRET`, se firma con un secret conocido.

### Mayores

5. **Sin validación de password** (longitud mínima, complejidad) ni de email más allá del HTML5 del frontend.
6. **Sin paginación** en listados (`/stock`, `/pedido`, `/api/usuarios`). Va a escalar mal.
7. **`populate` no se invoca**: el `ref` ya está corregido (`'Cerveza'`), pero `getAllPedidos`/`getPedidoById` siguen devolviendo sólo IDs; el frontend tendría que resolver nombres uno a uno.
8. **bcrypt sigue con 10 rounds** — debería subirse a ≥ 12 (o usar `argon2`).
9. **Sin transacción multi-documento real**: el descuento atómico por ítem + rollback mitiga la race, pero no es una transacción Mongo.
10. **El login revela existencia de usuarios** (enumeración): devuelve mensajes/status distintos para "usuario no encontrado" vs "contraseña incorrecta".
11. **La URI/host del cluster de Mongo sigue hardcodeada** en [config.js:6](../backEnd/database/config.js#L6) (`cluster0.zbfn2s4.mongodb.net`).
12. **Las cervezas con `activo: false` siguen sin filtrarse** del catálogo.

### Menores / housekeeping

13. **URLs hardcodeadas + mezcla de Axios + HttpClient en el frontend Angular legado** (`http://localhost:3000` en 4 servicios; Axios solo en `AuthService`). Aplica al cliente Angular en reemplazo; el frontend React usa Axios con una constante `API_URL` centralizada.
14. **Naming inconsistente** (Angular legado): `UsuarioService.ts` vs `cerveza.service.ts` vs `pedidos.service.ts`.
15. **Routing inconsistente**: `/api/auth/`, `/api/usuarios/` con prefijo, pero `/stock`, `/pedido`, `/` sin él.
16. **Lógica de validación en controllers** (`stockController`, `pedidoController`) cuando debería estar en services o en un middleware de validación (Joi/Zod). _La validación es funcionalmente correcta tras el commit `5f8172e`, pero sigue dispersa en los controllers._
17. **0 tests** (backend y frontend). Sólo `.http` manuales. **Sin CI/CD.**
18. **`console.log` regado en services y repositorios** (debería ser un logger configurable). _Ya no se loguean datos sensibles, pero sigue faltando un logger._
19. **`window.location.href = '/login'`** en `pedidos.component.ts` (Angular legado) → debería usar `Router`.
20. **Duplicación de fuente de verdad** en `AuthService` (Angular legado): lee y mantiene `BehaviorSubject` + `localStorage` y los dos pueden desincronizarse.
21. **`AdminDashboardComponent` / `AdminHomeComponent`** importados con alias inconsistente desde `app.routes.ts` (Angular legado).
22. **Sin guard global** (Angular legado): la ruta raíz `'/'` requiere `AuthGuard` pero no hay redirección inicial bien definida.

✅ **(Corregido — commit 5f8172e)** El bug de falsy en `stockController.createCerveza` (no permitía `stock_actual = 0` ni `activo = false`) está resuelto — ver punto 11 de la sección _Corregido_.

---

## Sugerencias de mejora

### Seguridad (prioridad 1)

1. Mover el **host/URI completa de Mongo a `.env`** (el `JWT_SECRET` ya se lee de `.env`). Validar al boot que las variables estén definidas (fallar fuerte si no) y **quitar el fallback `'TpCervezas'`** del secret.
2. ~~Crear `backEnd/middlewares/auth.js` con `verifyToken` y `requireRole(...roles)`~~ ✅ Hecho (commit `5f8172e`): aplicados a todas las rutas excepto `/api/auth/*`.
3. ~~En el frontend, adjuntar `Authorization: Bearer ${token}` a todas las requests~~ ✅ Hecho en React (interceptor de Axios en `http.ts`). Pendiente para el Angular legado (que se reemplaza).
4. ~~Restringir CORS a los orígenes conocidos~~ ✅ Hecho (regex `localhost`).
5. Agregar `express-rate-limit` al login y register. _(Pendiente.)_
6. Hashear con bcrypt rounds ≥ 12 (o usar `argon2`). _(Pendiente — sigue en 10 rounds.)_
7. ~~Sanitizar inputs contra NoSQL injection~~ ✅ Parcial: `findUserByEmail` coerciona el email a string. Evaluar `express-mongo-sanitize` para una cobertura general.
8. ~~Eliminar el log de password en plano en `createEmpleadoService`~~ ✅ Hecho.
9. Agregar `helmet`/headers de seguridad. _(Pendiente.)_
10. Migrar el JWT del frontend de `localStorage` a `httpOnly cookie` (XSS). _(Pendiente.)_

### Calidad

11. Introducir un **validator schema** (Zod o Joi) por endpoint y un middleware de validación (la validación actual es correcta pero sigue dispersa en los controllers).
12. **Middleware central de errores** que mapee `error.status` y serialice un payload uniforme (hoy el mapeo de `error.status` está sólo en `authController`).
13. ~~**Transacción / consistencia de stock** para `createPedido`~~ ✅ Parcial: descuento atómico por ítem con rollback. Falta una **transacción Mongo multi-documento** real.
14. ~~Lógica de **restitución de stock** cuando un pedido se rechaza o se elimina~~ ✅ Hecho.
15. ~~Arreglar el `ref: 'cervezas'` → `ref: 'Cerveza'`~~ ✅ Hecho. Falta **agregar `populate`** en las queries de pedido (el ref ya está corregido pero no se invoca).
16. **Tests** mínimos: smoke tests con supertest del backend (auth, stock, pedido) y al menos 2 specs por componente crítico del front. _(Pendiente.)_
17. Reemplazar `console.*` por un logger (`pino` o `winston`) configurable por nivel. _(Pendiente.)_
18. En el frontend React, mantener Axios + `API_URL` centralizada (ya hecho). En el Angular legado, unificar HTTP client y centralizar `apiUrl` en `environment.ts` (de no descartarse el cliente).

### Producto

19. Paginación en listados.
20. Endpoint dedicado `PATCH /pedido/:id/aprobar` y `/rechazar` (en vez del genérico `PATCH /pedido/:id` que acepta cualquier campo).
21. Vista de auditoría de pedidos aprobados (ya hay `aprobado_por` y `fecha_aprobacion`).
22. Histórico de stock — hoy `stock_actual` se sobrescribe sin trazabilidad.

---

## Scripts útiles

```bash
# Backend
cd backEnd && npm run dev        # arranca con nodemon
cd backEnd && npm start          # arranca con node

# Frontend
cd frontEnd && npm start         # ng serve
cd frontEnd && npm run build     # build de producción
cd frontEnd && npm test          # karma (sin specs hoy)
```

---

## Roles del sistema

| Rol | Capacidades |
|---|---|
| **cliente** | Registrarse, loguearse, ver cervezas, armar y enviar pedidos, ver sus propios pedidos |
| **empleado** | Loguearse, gestionar stock de cervezas (CRUD), aprobar/rechazar pedidos |
| **admin** | Todo lo del empleado + gestionar usuarios (activar/desactivar, cambiar rol), crear empleados |

Ver detalle completo en [BUSINESS_RULES.md](business/BUSINESS_RULES.md).
