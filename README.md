# tpGrupoFrontBack — Sistema de Gestión de Cervezas y Pedidos

Trabajo práctico que implementa un sistema de gestión de stock de cervezas y pedidos con tres roles diferenciados (cliente, empleado, admin). Compuesto por un backend REST en Node.js/Express y un frontend en Angular 19.

> Documentación complementaria:
> - [Arquitectura](docs/architecture/ARCHITECTURE.md)
> - [Reglas de negocio](docs/business/BUSINESS_RULES.md)

---

## Stack tecnológico

### Backend
- **Runtime:** Node.js
- **Framework:** Express 5
- **ORM/ODM:** Mongoose 8
- **Base de datos:** MongoDB Atlas (cluster cloud)
- **Autenticación:** JSON Web Tokens (jsonwebtoken 9) + bcrypt 6
- **Configuración:** dotenv 16
- **CORS:** cors 2.8
- **Dev:** nodemon 3

### Frontend
- **Framework:** Angular 19 (standalone components)
- **UI:** PrimeNG 19 + tema Aura + PrimeIcons
- **Estilos:** TailwindCSS 4
- **HTTP:** `@angular/common/http` (HttpClient) + Axios 1.9 (en AuthService)
- **Reactividad:** RxJS 7.8 + Zone.js
- **Tooling:** Angular CLI 19 + TypeScript 5.7

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
├── frontEnd/                SPA Angular 19
│   └── src/
│       ├── app/
│       │   ├── components/  Vistas (login, register, stock, pedidos, admin…)
│       │   ├── guards/      Auth/Guest/Role/Admin/Empleado/Cliente
│       │   ├── models/      Interfaces TS (IUsuario, ICerveza, IPedido…)
│       │   ├── layout/      Layout principal + navbar
│       │   └── app.routes.ts
│       └── services/        AuthService, UsuarioService, CervezaService, PedidosService
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
```

> El cluster está hardcodeado en [backEnd/database/config.js](backEnd/database/config.js) (`cluster0.zbfn2s4.mongodb.net`). Para usar otra instancia hay que editar el archivo.

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

Backend escucha en `http://localhost:3000` (o el `PORT` del `.env`).
Frontend asume el backend en `http://localhost:3000` (URL hardcodeada en los servicios).

---

## Resumen técnico

| Aspecto | Estado |
|---|---|
| Arquitectura backend | 4 capas (route → controller → service → repository) bien separadas |
| Arquitectura frontend | Standalone components + servicios inyectables + guards por rol |
| Persistencia | MongoDB Atlas vía Mongoose, sin transacciones |
| Autenticación | JWT firmado, password con bcrypt (10 rounds) |
| Autorización | **Solo en el frontend** (guards). El backend **no valida JWT ni roles** |
| Validación de entrada | Mínima, dispersa entre controllers |
| Manejo de errores | Catch local en cada controller, sin middleware central |
| Logging | `console.log/error` (incluye datos sensibles en algunos lugares) |
| Tests | No hay |
| CI/CD | No hay |
| Documentación | Sólo este conjunto de docs |

El stack es coherente y la separación en capas del backend es limpia. La debilidad principal está en la **seguridad del backend** (el JWT no se verifica en ninguna ruta) y en la **ausencia de tests**.

---

## Deuda técnica

### Bloqueantes / críticos

1. **JWT secret hardcodeado** en [authService.js:5](backEnd/services/authService.js#L5) (`SECRET_KEY = "TpCervezas"`). Debe ir a `process.env.JWT_SECRET`.
2. **Ninguna ruta del backend verifica el JWT.** Todos los endpoints de `/stock`, `/pedido`, `/api/usuarios` están abiertos. Falta un middleware `verifyToken` y otro `requireRole`.
3. **El frontend depende exclusivamente de guards** para autorizar. Cualquier cliente HTTP (Postman, curl) puede saltarse esa capa.
4. **Bug en `adminUsuarioService.updateUsuarioService`** ([línea 52](backEnd/services/adminUsuarioService.js#L52)): `throw error("Error en el service" + error)` invoca `error` como función — `error` es la variable del catch, no es invocable; lanzará `TypeError`.
5. **`PORT` sin valor por defecto** ([index.js:5](backEnd/index.js#L5)) — si falta el `.env`, `app.listen(undefined)` arranca en puerto aleatorio.
6. **Race condition en creación de pedido**: stock se descuenta y luego se crea el pedido sin transacción ([pedidoService.js:5-19](backEnd/services/pedidoService.js#L5-L19)). Dos pedidos concurrentes pueden sobrevender stock.
7. **Stock no se restituye al rechazar/borrar pedido** — pedido descontó stock al crearse, queda perdido si se rechaza.
8. **Inconsistencia en `ref` del schema**: `Pedido.cervezas[].cerveza` referencia `'cervezas'` (minúscula) pero el modelo registrado es `'Cerveza'` ([Pedido.js:11](backEnd/models/Pedido.js#L11)). Eso rompe `populate()`.

### Mayores

9. **CORS totalmente abierto** (`app.use(cors())`) — debería restringirse a `origin: http://localhost:4200` (o el dominio prod).
10. **Sin validación de password** (longitud mínima, complejidad) ni de email más allá del HTML5 del frontend.
11. **Validaciones del backend con bug de falsy**: `if (stock_actual && typeof stock_actual !== "number")` ([stockController.js:13-16](backEnd/controllers/stockController.js#L13-L16)) — `stock_actual === 0` se considera ausente, no se valida.
12. **`updateUsuario` acepta cualquier campo del body** ([adminUsuarioRepository.js:41](backEnd/repository/adminUsuarioRepository.js#L41)) → permite que un cliente cambie su propio rol a admin si llama el endpoint (que no está protegido).
13. **Sin paginación** en listados (`/stock`, `/pedido`, `/api/usuarios`). Va a escalar mal.
14. **Sin populate**: `getAllPedidos` devuelve sólo IDs de cerveza y usuario; el frontend tendría que resolver nombres uno a uno.
15. **Logs de datos sensibles**: `createEmpleadoService` loguea la password en plano antes del hash ([adminUsuarioService.js:7](backEnd/services/adminUsuarioService.js#L7)).
16. **JWT en `localStorage`** en el frontend — expuesto a XSS. Mejor `httpOnly cookie`.
17. **Token nunca se envía al backend**: el frontend guarda el JWT pero **no lo manda en `Authorization`**. Cuando se agregue el middleware de auth se va a romper todo.
18. **Sin rate limiting** en `/api/auth/login` → expuesto a fuerza bruta.

### Menores / housekeeping

19. **URLs hardcodeadas en el frontend** (`http://localhost:3000` en 4 servicios). Falta un `environment.ts`.
20. **Mezcla de Axios + HttpClient** en el frontend (Axios solo en `AuthService`). Unificar.
21. **Naming inconsistente**: `UsuarioService.ts` vs `cerveza.service.ts` vs `pedidos.service.ts`.
22. **Routing inconsistente**: `/api/auth/`, `/api/usuarios/` con prefijo, pero `/stock`, `/pedido`, `/` sin él.
23. **Lógica de validación en controllers** (`stockController`, `pedidoController`) cuando debería estar en services o en un middleware de validación (Joi/Zod).
24. **0 tests** (backend y frontend). Sólo `.http` manuales.
25. **`console.log` regado en services y repositorios** (debería ser un logger configurable).
26. **`window.location.href = '/login'`** en `pedidos.component.ts` → debería usar `Router`.
27. **Duplicación de fuente de verdad** en `AuthService`: lee y mantiene `BehaviorSubject` + `localStorage` y los dos pueden desincronizarse.
28. **`AdminDashboardComponent` / `AdminHomeComponent`** importados con alias inconsistente desde `app.routes.ts`.
29. **`stockController.createCerveza` no permite `stock_actual=0` ni `activo=false`** explícitamente (mismo bug de falsy del punto 11).
30. **Sin guard global**: la ruta raíz `'/'` requiere `AuthGuard` pero no hay redirección inicial bien definida.

---

## Sugerencias de mejora

### Seguridad (prioridad 1)

1. Mover `JWT_SECRET` y la URI completa de Mongo a `.env`. Validar al boot que estén definidas (fallar fuerte si no).
2. Crear `backEnd/middlewares/auth.js` con `verifyToken` (lee `Authorization: Bearer …`) y `requireRole(...roles)`. Aplicarlos a todas las rutas excepto `/api/auth/*`.
3. En el frontend, configurar un `HttpInterceptor` que adjunte `Authorization: Bearer ${token}` a todas las requests.
4. Restringir CORS a los orígenes conocidos.
5. Agregar `express-rate-limit` al login y register.
6. Hashear con bcrypt rounds ≥ 12 (o usar `argon2`).
7. Sanitizar inputs contra NoSQL injection (`express-mongo-sanitize`).
8. Eliminar el log de password en plano en `createEmpleadoService`.

### Calidad

9. Introducir un **validator schema** (Zod o Joi) por endpoint y un middleware de validación.
10. **Middleware central de errores** que mapee `error.status` y serialice un payload uniforme.
11. **Transacción Mongo** para `createPedido` (validar stock, descontar, crear pedido).
12. Lógica de **restitución de stock** cuando un pedido se rechaza o se elimina.
13. Arreglar el `ref: 'cervezas'` → `ref: 'Cerveza'`, y agregar `populate` en `pedidoRepository.getAllPedidos`.
14. **Tests** mínimos: smoke tests con supertest del backend (auth, stock, pedido) y al menos 2 specs por componente crítico del front.
15. Reemplazar `console.*` por un logger (`pino` o `winston`) configurable por nivel.
16. Unificar HTTP client en el frontend (sólo `HttpClient`) y centralizar `apiUrl` en `environment.ts`.

### Producto

17. Paginación en listados.
18. Endpoint dedicado `PATCH /pedido/:id/aprobar` y `/rechazar` (en vez del genérico `PATCH /pedido/:id` que acepta cualquier campo).
19. Vista de auditoría de pedidos aprobados (ya hay `aprobado_por` y `fecha_aprobacion`).
20. Histórico de stock — hoy `stock_actual` se sobrescribe sin trazabilidad.

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

Ver detalle completo en [BUSINESS_RULES.md](docs/business/BUSINESS_RULES.md).
