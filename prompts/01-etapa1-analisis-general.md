# 01 — Análisis general del proyecto

**Etapa:** 1 — Comprender el Proyecto
**Fecha:** 2026-05-21
**Modelo:** Claude Opus 4.7 (1M context)
**Salida:**
- [docs/README.md](../docs/README.md)
- [docs/architecture/ARCHITECTURE.md](../docs/architecture/ARCHITECTURE.md)
- [docs/business/BUSINESS_RULES.md](../docs/business/BUSINESS_RULES.md)

---

## Prompt

```
Analizá este proyecto completo.
Explicame:
- arquitectura general
- tecnologías utilizadas
- flujo principal del sistema
- módulos importantes
- dependencias críticas
- riesgos técnicos
- posibles problemas de seguridad
Además generá:
- resumen técnico
- lista de deuda técnica
- sugerencias de mejora


Todo esto documentalo en archivos
● README.md
● ARCHITECTURE.md
● BUSINESS_RULES.md
```

---

## Contexto inicial

Antes del prompt principal, se le pidió a Claude crear la estructura de carpetas exigida por la consigna:

```
/docs
/docs/architecture
/docs/business
/docs/database
/docs/security
/prompts
```

## Cómo procedió Claude

1. Exploró el repositorio (`backEnd/` Node.js + `frontEnd/` Angular) leyendo `package.json`, `index.js`, `app.routes.ts`, todos los `models/`, `routes/`, `controllers/`, `services/`, `repository/`, `guards/` y los `services/` del frontend.
2. Identificó el stack: **Express 5 + Mongoose 8 + MongoDB Atlas + JWT + bcrypt** en el back; **Angular 19 + PrimeNG + Tailwind 4 + Axios/HttpClient** en el front.
3. Generó los tres documentos en paralelo, con foco en:
   - Capas del backend (route → controller → service → repository → model).
   - Guards y servicios del frontend.
   - Flujo principal del pedido (cliente → arma carrito → backend valida stock → descuenta → crea pedido pendiente → empleado/admin aprueba).
   - Hallazgos críticos de seguridad y bugs.

## Hallazgos más relevantes que reportó

**Críticos (seguridad / correctitud)**
- JWT secret hardcodeado en `authService.js` (`"TpCervezas"`).
- Ningún endpoint del backend valida el JWT — autorización 100% en el frontend (guards).
- El frontend guarda el token pero **no lo envía** en `Authorization`.
- `updateUsuario` acepta cualquier campo del body → mass-assignment (escalada de privilegios).
- Race condition en `createPedido` (validación + descuento + creación sin transacción).
- Stock no se restituye al rechazar o eliminar un pedido.
- `ref: 'cervezas'` apunta a un modelo que no existe (debe ser `'Cerveza'`).
- Bug en `adminUsuarioService.updateUsuarioService`: `throw error("...")` invoca la variable del catch como función.

**Mayores**
- CORS totalmente abierto.
- Sin rate limiting en login.
- Sin validación de complejidad de password.
- URLs hardcodeadas en el frontend (`http://localhost:3000`).
- Mezcla de Axios + HttpClient en el frontend.
- Sin tests automatizados ni CI.

## Observaciones / iteraciones

- Antes de empezar, Claude verificó que `.env` estuviera en `.gitignore` y no commiteado (estaba OK).
- La consigna no especificaba dónde ubicar el `README.md`. Quedó dentro de `/docs/` — pendiente decidir si se mueve a la raíz del repositorio para que GitHub lo muestre por defecto.
- Las carpetas `/docs/database/` y `/docs/security/` se crearon vacías; en esta etapa no había contenido que cargar allí.
