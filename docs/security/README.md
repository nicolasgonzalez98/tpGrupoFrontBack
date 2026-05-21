# Security

Documentación de seguridad del proyecto: auditorías, hallazgos, mitigaciones, política de manejo de secretos y dependencias.

> **Pendiente.** Esta carpeta se completará en una etapa posterior del trabajo práctico (auditoría de seguridad detallada, threat model, plan de remediación).

## Contexto actual

Los hallazgos preliminares de seguridad detectados durante el análisis inicial están listados en:

- [ARCHITECTURE.md §9 — Problemas de seguridad](../architecture/ARCHITECTURE.md#9-problemas-de-seguridad) (20 hallazgos catalogados por severidad).
- [README.md — Deuda técnica](../README.md#deuda-técnica) (items bloqueantes S1–S4).

### Resumen ejecutivo

- **Críticos:** JWT secret hardcodeado, backend sin verificación de token, autorización solo en el frontend, mass-assignment en `updateUsuario`.
- **Altos:** CORS abierto, sin rate limiting, JWT en localStorage, NoSQL injection posible.
- **Medios/bajos:** logs de datos sensibles, enumeración de usuarios, sin headers de seguridad (`helmet`).
