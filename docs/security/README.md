# Security

Documentación de seguridad del proyecto: hallazgos, estado de remediación y pendientes.

> **Última actualización:** 2026-06-17 (commit `5f8172e`).

## Estado tras el commit `5f8172e`

Se cerraron los hallazgos **críticos** detectados en el análisis inicial. El detalle completo y catalogado por severidad (con columna de estado) está en [ARCHITECTURE.md §9](../architecture/ARCHITECTURE.md#9-problemas-de-seguridad).

### Corregido

- ✅ **JWT secret**: se lee de `process.env.JWT_SECRET` ([middlewares/auth.js](../../backEnd/middlewares/auth.js), [authService.js](../../backEnd/services/authService.js)); antes estaba hardcodeado en el código.
- ✅ **Verificación de token en el backend**: middleware `verifyToken` + `requireRole` aplicado a todas las rutas salvo `/api/auth/*`. Token ausente/inválido → **401**; rol sin permiso → **403**.
- ✅ **Autorización ya no es solo del frontend**: el front React envía `Authorization: Bearer <token>` (interceptor de Axios [frontReact/src/services/http.ts](../../frontReact/src/services/http.ts)) y el backend valida. Un cliente HTTP sin token válido es rechazado.
- ✅ **Mass-assignment en `updateUsuario`**: whitelist de campos permitidos (`nombre`, `email`, `rol`, `activo`).
- ✅ **`usuario_id` del token** en `createPedido` (antes se confiaba en el body → se podían crear pedidos a nombre de otro).
- ✅ **CORS**: restringido a orígenes `localhost` (antes abierto a todos).
- ✅ **NoSQL injection** en `findUserByEmail`: el email se coerciona a string.
- ✅ **Hash de password expuesto**: `getAllUsuarios` ya no devuelve el campo `password`.
- ✅ **Logs de datos sensibles**: se quitaron los `console.log` que imprimían password/usuarios.

### Pendiente

- ⏳ **Fallback del `JWT_SECRET`** (`'TpCervezas'`) todavía existe; en producción definir siempre `JWT_SECRET` y quitar el fallback.
- ⏳ **Rate-limiting** en `/api/auth/login` (fuerza bruta) — falta `express-rate-limit`.
- ⏳ **Headers de seguridad** (`helmet`: CSP, HSTS, X-Frame-Options…).
- ⏳ **JWT en `localStorage`** en el frontend (expuesto a XSS); evaluar cookie `httpOnly`.
- ⏳ **bcrypt** con ≥12 rounds (hoy 10).
- ⏳ **Enumeración de usuarios** en el login (mensajes/estados 404 vs 401 distintos).
- ⏳ **Mensajes de error de Mongoose** reenviados al cliente.
- ⏳ **Whitelist de campos** también en `updateCerveza`/stock (hoy el controller arma `updateData` con campos conocidos, pero no hay whitelist explícita en la capa de repositorio).

> Hallazgos completos y por severidad: [ARCHITECTURE.md §9](../architecture/ARCHITECTURE.md#9-problemas-de-seguridad). Deuda técnica general: [README.md — Deuda técnica](../README.md#deuda-técnica).
