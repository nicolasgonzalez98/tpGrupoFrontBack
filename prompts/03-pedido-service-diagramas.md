# 03 — Diagramas Mermaid del módulo `pedidoService.js`

**Etapa:** 1 — Comprender el Proyecto (visualización del módulo)
**Fecha:** 2026-05-22
**Modelo:** Claude Opus 4.7 (1M context)
**Salida:**
- [docs/architecture/MODULE_PEDIDO_SERVICE_DIAGRAMS.md](../docs/architecture/MODULE_PEDIDO_SERVICE_DIAGRAMS.md)

---

## Prompt

```
Generá diagramas Mermaid para explicar este módulo.
Incluí:
- flujo de datos
- relación entre componentes
- interacción entre servicios
- conexión con la base de datos

y documentalo en un .md (el cual te parezca conveniente de las carpetas que ya tenemos)
```

---

## Contexto previo

En el turno anterior se produjo el deep-dive técnico [MODULE_PEDIDO_SERVICE.md](../docs/architecture/MODULE_PEDIDO_SERVICE.md) con 8 secciones (responsabilidades, dependencias, funciones, endpoints, reglas, riesgos R1–R8, mejoras priorizadas, resumen).

Este turno extiende la documentación con **diagramas Mermaid** que materializan visualmente los hallazgos.

---

## Cómo procedió Claude

1. **No releyó código**: el material del turno anterior alcanzaba para diagramar.

2. **Diseñó 6 diagramas** (4 solicitados + 2 bonus por valor agregado):

   | # | Tipo Mermaid | Diagrama | Cubre |
   |---|---|---|---|
   | 1 | `sequenceDiagram` | Flujo de datos `createPedido` end-to-end | "flujo de datos" del prompt |
   | 2 | `graph TB` | Relación entre componentes por capas | "relación entre componentes" |
   | 3 | `flowchart LR` | Interacción `pedidoService` ↔ repositorios | "interacción entre servicios" |
   | 4 | `erDiagram` | Modelo de datos (Usuario / Cerveza / Pedido / item embebido) | "conexión con la base de datos" |
   | 5 | `stateDiagram-v2` | Máquina de estados del pedido | bonus — transiciones permitidas vs prohibidas |
   | 6 | `sequenceDiagram` x2 | Race condition (bug actual + fix con transacción) | bonus — visualizar R1 y la mejora propuesta |

3. **Decisión de ubicación**: `/docs/architecture/MODULE_PEDIDO_SERVICE_DIAGRAMS.md`, junto al análisis textual del módulo. Convención: archivos `MODULE_<nombre>.md` y `MODULE_<nombre>_DIAGRAMS.md` se acompañan.

4. **Enriquecimiento más allá del prompt**:
   - Cada diagrama incluye **anotaciones contextuales** (BUG, ⚠️, warnings) que conectan con los riesgos R1–R8 del análisis.
   - Resaltado visual con colores: amarillo = target, rojo = punto crítico, naranja = repositorios coordinados.
   - Sección final con instrucciones para **renderizar** los diagramas (GitHub nativo, VSCode con extensión, mermaid.live).

---

## Hallazgos visuales más relevantes

- El diagrama de secuencia de `createPedido` deja explícito que las fases **[A] validación** y **[B] descuento** son N+1 cada una (N queries por ítem), totalizando **2N+1 round-trips** para un pedido de N cervezas.
- El diagrama de componentes confirma que `pedidoService` es el **único service** del backend que cruza la frontera de su agregado (toca `cervezaRepository`).
- El diagrama de interacción muestra que **5 de 6 funciones** son pass-through al repositorio — toda la complejidad del módulo está en `createPedido`.
- El ERD hace visible el bug del `ref: 'cervezas'` apuntando a un modelo que se registra como `'Cerveza'`.
- La máquina de estados muestra **4 transiciones prohibidas** que hoy están permitidas (`aprobado → pendiente`, etc.).
- El diagrama de race condition lado-a-lado (bug vs fix con `findOneAndUpdate` condicional) hace tangible la solución propuesta en la sección 7 del análisis.

---

## Observaciones / iteraciones

- Sistema en "Auto Mode": Claude eligió `/docs/architecture` sin consultar entre las opciones ofrecidas previamente (`architecture`, `business`, `api`). Lógica: este documento es complemento directo de `MODULE_PEDIDO_SERVICE.md`, conviene mantenerlos juntos.
- Se agregaron 2 diagramas **adicionales** al pedido original (estados + race condition) porque aportaban valor inmediato y conectaban con los riesgos ya documentados. Si el alcance debía ser estricto, removerlos no afecta los 4 solicitados.
- Se incluyó la nota sobre renderizado porque GitHub lo soporta nativo pero VSCode requiere extensión — útil para el equipo evaluador del TP.
