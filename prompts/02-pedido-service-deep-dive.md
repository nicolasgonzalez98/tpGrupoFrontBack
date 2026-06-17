# 02 — Deep-dive del módulo `pedidoService.js`

**Etapa:** 1 — Comprender el Proyecto (zoom-in a un módulo)
**Fecha:** 2026-05-22
**Modelo:** Claude Opus 4.7 (1M context)
**Salida:**
- [docs/architecture/MODULE_PEDIDO_SERVICE.md](../docs/architecture/MODULE_PEDIDO_SERVICE.md)

---

## Prompt

```
dale, vamos con pedidoService.js.

Explicame este módulo paso a paso.
Necesito:
- responsabilidades
- flujo de ejecución
- dependencias
- endpoints o funciones importantes
- reglas de negocio
- riesgos
- mejoras posibles
```

---

## Contexto previo

En el turno anterior Claude propuso tres candidatos para análisis profundo:

1. `backEnd/services/pedidoService.js` — único service con lógica compuesta (validación de stock + descuento + creación), bug de race condition, no transaccional.
2. `backEnd/services/authService.js` — JWT hardcodeado y todo el agujero conceptual de auth client-side.
3. `frontEnd/src/services/authService.ts` — mezcla Axios con el resto que usa HttpClient, dos fuentes de verdad (`BehaviorSubject` + `localStorage`).

Recomendó `pedidoService.js` por ser el que mezcla dominio, persistencia y un bug real de concurrencia. El usuario aceptó.

---

## Cómo procedió Claude

1. **Lectura del módulo y de su entorno inmediato** (5 archivos):
   - [pedidoService.js](../backEnd/services/pedidoService.js) — el target.
   - [pedidoRepository.js](../backEnd/repository/pedidoRepository.js) — capa inferior.
   - [pedidoController.js](../backEnd/controllers/pedidoController.js) — capa superior.
   - [pedidoRoutes.js](../backEnd/routes/pedidoRoutes.js) — endpoints expuestos.
   - [Pedido.js](../backEnd/models/Pedido.js) — schema.
   - [cervezaRepository.js](../backEnd/repository/cervezaRepository.js) — segundo repositorio que usa el service.

2. **Análisis estructurado** con 8 secciones:
   - Responsabilidades.
   - Dependencias (incluyendo las **ausentes**).
   - Funciones expuestas (pass-through vs composición).
   - Endpoints consumidores con el detalle de que **ninguno está autenticado**.
   - Reglas de negocio implementadas vs gaps.
   - Riesgos R1–R8.
   - Mejoras priorizadas en 3 tiers.
   - Resumen ejecutivo en tabla.

3. **Documentación** en [docs/architecture/MODULE_PEDIDO_SERVICE.md](../docs/architecture/MODULE_PEDIDO_SERVICE.md). Se eligió `/docs/architecture` (entre las tres opciones ofrecidas: architecture, business, api) porque el análisis es técnico a nivel de capa de aplicación, no un contrato API ni reglas de dominio puras.

---

## Hallazgos más relevantes

### Riesgos críticos identificados

- **R1 — Race condition / sobreventa de stock**: `createPedido` valida stock y luego descuenta en operaciones separadas, sin transacción ni `findOneAndUpdate` condicional. Dos pedidos concurrentes pueden sobrevender.
- **R2 — Inconsistencia parcial**: si Mongo falla entre el descuento de stock y la persistencia del pedido, el stock queda descontado sin pedido asociado.
- **R3 — Stock perdido al rechazar/eliminar**: el descuento ocurre al crear, pero no hay restitución cuando se rechaza o se borra.
- **R4 — `cantidad` negativa suma stock**: `$inc: -cantidad` con `cantidad: -5` resuelve a `+5`. Vector trivial para inflar inventario.
- **R5 — `usuario_id` del body**: un cliente puede crear pedidos a nombre de otro usuario.

### Riesgos menores

- **R6 — N+1**: validación lineal sobre los ítems del pedido (un query por cerveza).
- **R7 — `populate` roto**: `ref: 'cervezas'` apunta a un modelo que se registra como `'Cerveza'`.
- **R8 — Regla de dominio fuera de lugar**: `fecha_aprobacion` se setea en el repository, no en el service.

### Mejoras propuestas

Tres mejoras de Prioridad 1 que se pueden bundlear en una sola PR:
1. **Transacción Mongo** para `createPedido` usando `session.withTransaction()` + `findOneAndUpdate` con filtro condicional (cierra R1 y R2 simultáneamente).
2. **Validación de `cantidad`** (entero positivo) en el service (cierra R4).
3. **Restitución de stock** al cambiar a `estado: 'rechazado'` o al eliminar (cierra R3).

Se incluyó un **esqueleto de código** para la implementación de la transacción.

---

## Observaciones / iteraciones

- El sistema estaba en "Auto Mode", así que Claude tomó decisiones sin frenar a preguntar:
  - Eligió `/docs/architecture` sobre `/docs/business` o `/docs/api` sin consultar (la elección está documentada arriba en "cómo procedió").
  - Nombre del archivo: `MODULE_PEDIDO_SERVICE.md` — convención propuesta para futuros deep-dives de módulos (`MODULE_<nombre>.md`).
- No se modificó código del proyecto en este turno; sólo análisis y documentación.
- Pendiente decidir si se enlaza este documento desde [ARCHITECTURE.md §6](../docs/architecture/ARCHITECTURE.md#6-módulos-importantes) para mejor descubribilidad.
