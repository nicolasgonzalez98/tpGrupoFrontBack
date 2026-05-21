# Database

Documentación de la base de datos del proyecto: modelo de datos, diagramas, decisiones de diseño, índices, migraciones.

> **Pendiente.** Esta carpeta se completará en una etapa posterior del trabajo práctico (modelado de datos, diagrama ER, análisis de queries y performance).

## Contexto actual

- Motor: **MongoDB Atlas** (cluster `cluster0.zbfn2s4`).
- ODM: **Mongoose 8**.
- Colecciones actuales: `usuarios`, `cervezas`, `pedidos`.

Las definiciones de schema viven en [backEnd/models/](../../backEnd/models/) y los campos están descriptos en [BUSINESS_RULES.md §2](../business/BUSINESS_RULES.md#2-entidades).
