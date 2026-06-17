# Prompts

Registro de los prompts usados con Claude a lo largo del trabajo práctico. Cada prompt queda como evidencia de cómo se construyó la documentación, las auditorías y los análisis del repositorio.

## Convención de nombres

```
NN-etapaN-tema.md
```

- `NN` — número correlativo de dos dígitos (`01`, `02`, …).
- `etapaN` — etapa de la consigna (`etapa1`, `etapa2`, `etapa3`, …).
- `tema` — descripción breve en kebab-case (`analisis-general`, `auditoria-seguridad`, `diagrama-er`, …).

Ejemplos:
- `01-etapa1-analisis-general.md`
- `02-etapa2-auditoria-seguridad.md`
- `03-etapa2-diagrama-er.md`

## Formato sugerido para cada prompt

Cada archivo debería contener al menos:

```markdown
# NN — Título corto
**Etapa:** N
**Fecha:** YYYY-MM-DD
**Modelo:** Claude <versión>
**Salida:** rutas relativas a los archivos generados/modificados

## Prompt
<el texto literal enviado a Claude>

## Observaciones / iteraciones
<si hubo repreguntas, ajustes, correcciones o cosas que Claude hizo distinto a lo esperado>
```

## Índice

| # | Etapa | Tema | Archivo |
|---|---|---|---|
| 01 | 1 | Análisis general del proyecto | [01-etapa1-analisis-general.md](01-etapa1-analisis-general.md) |
| 02 | 2 | Documentación de API y modelo de datos | [02-etapa2-documentacion-api-modelo-datos.md](02-etapa2-documentacion-api-modelo-datos.md) |