# 02 — Documentación de API y modelo de datos (mantenimiento)

**Etapa:** 2 — Documentación técnica viva
**Fecha:** 2026-06-16
**Modelo:** Claude Opus 4.8 (1M context)
**Salida:**
- [docs/api/README.md](../docs/api/README.md) (nuevo)
- [docs/database/README.md](../docs/database/README.md) (completado, antes "Pendiente")
- [docs/README.md](../docs/README.md) (índice de docs complementarias)
- [docs/business/BUSINESS_RULES.md](../docs/business/BUSINESS_RULES.md) (corrección de inconsistencia en login)

---

## Prompt

```
Actuás como Arquitecto de Software y Especialista en Documentación Técnica.
Analizá el repositorio completo y generá documentación técnica actualizada
basada exclusivamente en el código existente: comprensión del sistema,
arquitectura, API y endpoints, modelo de datos (ERD), lógica de negocio.
Reglas: derivar todo del código, no inventar, usar Markdown y Mermaid,
mantener trazabilidad. Ante inconsistencias: informarlas, proponer correcciones
y actualizar la documentación.
```

---

## Cómo procedió Claude

1. Verificó la documentación de Etapa 1 (README, ARCHITECTURE, BUSINESS_RULES) contra el código backend y frontend actual: resultó **precisa y sincronizada**.
2. Detectó tres brechas respecto de la consigna: faltaba doc dedicada de **API/endpoints**, el ERD de base de datos estaba en estado "Pendiente", y los diagramas existentes usaban ASCII en vez de **Mermaid**.
3. Generó [docs/api/README.md](../docs/api/README.md) con el contrato exacto de los 18 endpoints (request/response, status codes reales por controller, ejemplos) + diagramas de secuencia Mermaid (login y creación de pedido).
4. Completó [docs/database/README.md](../docs/database/README.md) con el ERD en Mermaid, detalle de las 3 colecciones, relaciones, índices y problemas del modelo.

## Inconsistencia reportada (código vs. documentación previa)

- **Login siempre devuelve HTTP 500**: el `authService.login` lanza errores con `error.status` 404/401, pero `authController.login` hace `res.status(500)` fijo en el `catch` e ignora `error.status`. La doc de Etapa 1 indicaba 404/401. Se corrigió en BUSINESS_RULES y se documentó el comportamiento real en docs/api, con la corrección sugerida (`res.status(error.status || 500)`).

## Observaciones / iteraciones

- Las carpetas `docs/security/` y `docs/database/` estaban como stubs desde Etapa 1; `database` se completó, `security` sigue apuntando a ARCHITECTURE §9 (20 hallazgos catalogados).
- Toda la documentación de contratos se verificó leyendo `routes/`, `controllers/`, `services/`, `repository/` y `models/` del backend, y los `services/` + `models/` del frontend.
