# Modelo de Datos

Documentación de la base de datos del proyecto: motor, colecciones, esquemas, relaciones, diagrama entidad-relación e índices. **Derivada de los schemas Mongoose** en [backEnd/models/](../../backEnd/models/).

---

## 1. Contexto

- **Motor:** MongoDB Atlas (cluster `cluster0.zbfn2s4`, URI en [config.js](../../backEnd/database/config.js)).
- **ODM:** Mongoose 8.
- **Conexión:** [connection.js](../../backEnd/database/connection.js) (`mongoose.connect(uri_db)`; si falla, `process.exit(1)`).
- **Colecciones:** `usuarios`, `cervezas`, `pedidos` (nombres pluralizados automáticamente por Mongoose a partir de los modelos `Usuario`, `Cerveza`, `Pedido`).
- **Timestamps:** las tres colecciones tienen `{ timestamps: true }` → campos `createdAt` y `updatedAt` automáticos.

---

## 2. Diagrama entidad-relación (ERD)

```mermaid
erDiagram
    USUARIO ||--o{ PEDIDO : "crea (usuario_id)"
    USUARIO ||--o{ PEDIDO : "aprueba/rechaza (aprobado_por)"
    PEDIDO ||--|{ ITEM_PEDIDO : "contiene (cervezas[])"
    CERVEZA ||--o{ ITEM_PEDIDO : "referenciada por (cerveza)"

    USUARIO {
        ObjectId _id PK
        string nombre
        string email UK "unique, required"
        string password "hash bcrypt, required"
        string rol "enum admin|empleado|cliente, default cliente"
        boolean activo "default true"
        date createdAt
        date updatedAt
    }

    CERVEZA {
        ObjectId _id PK
        string nombre "required"
        string tipo "required"
        number stock_actual "default 0"
        number stock_minimo "default 0"
        boolean activo "default true"
        date createdAt
        date updatedAt
    }

    PEDIDO {
        ObjectId _id PK
        ObjectId usuario_id FK "ref Usuario, required"
        date fecha "default Date.now"
        string estado "enum pendiente|aprobado|rechazado, default pendiente"
        ObjectId aprobado_por FK "ref Usuario, default null"
        date fecha_aprobacion "default null"
        date createdAt
        date updatedAt
    }

    ITEM_PEDIDO {
        ObjectId cerveza FK "ref 'Cerveza', required"
        number cantidad "required"
    }
```

> `ITEM_PEDIDO` no es una colección propia: es el **subdocumento embebido** del array `cervezas[]` dentro de cada documento `Pedido` ([Pedido.js:9-14](../../backEnd/models/Pedido.js#L9-L14)).

---

## 3. Colecciones

### 3.1 `usuarios` — [Usuario.js](../../backEnd/models/Usuario.js)

| Campo | Tipo | Requerido | Default | Restricciones |
|---|---|---|---|---|
| `_id` | ObjectId | auto | auto | PK |
| `nombre` | String | sí | — | |
| `email` | String | sí | — | **único** (índice unique) |
| `password` | String | sí | — | hash bcrypt (10 rounds) |
| `rol` | String | sí | `"cliente"` | enum `admin` \| `empleado` \| `cliente` |
| `activo` | Boolean | no | `true` | si `false`, login rechazado |
| `createdAt` / `updatedAt` | Date | auto | auto | timestamps |

### 3.2 `cervezas` — [Cerveza.js](../../backEnd/models/Cerveza.js)

| Campo | Tipo | Requerido | Default | Restricciones |
|---|---|---|---|---|
| `_id` | ObjectId | auto | auto | PK |
| `nombre` | String | sí | — | |
| `tipo` | String | sí | — | string libre (sin enum) |
| `stock_actual` | Number | no | `0` | no negativo (validado en `updateCerveza`) |
| `stock_minimo` | Number | no | `0` | no negativo (validado en `updateCerveza`) |
| `activo` | Boolean | no | `true` | no filtra queries hoy |
| `createdAt` / `updatedAt` | Date | auto | auto | timestamps |

### 3.3 `pedidos` — [Pedido.js](../../backEnd/models/Pedido.js)

| Campo | Tipo | Requerido | Default | Restricciones |
|---|---|---|---|---|
| `_id` | ObjectId | auto | auto | PK |
| `usuario_id` | ObjectId | sí | — | FK → `Usuario` |
| `fecha` | Date | no | `Date.now` | |
| `estado` | String | no | `"pendiente"` | enum `pendiente` \| `aprobado` \| `rechazado` |
| `aprobado_por` | ObjectId | no | `null` | FK → `Usuario` |
| `fecha_aprobacion` | Date | no | `null` | se setea sólo al aprobar |
| `cervezas` | Array<subdoc> | sí | — | al menos requerido por validación de controller |
| `cervezas[].cerveza` | ObjectId | sí | — | FK → cerveza (`ref: 'Cerveza'`) |
| `cervezas[].cantidad` | Number | sí | — | |
| `createdAt` / `updatedAt` | Date | auto | auto | timestamps |

---

## 4. Relaciones

| Relación | Cardinalidad | Implementación |
|---|---|---|
| Usuario → Pedido (creador) | 1 : N | `Pedido.usuario_id` referencia `Usuario._id` |
| Usuario → Pedido (aprobador) | 1 : N | `Pedido.aprobado_por` referencia `Usuario._id` (nullable) |
| Pedido → Cerveza | N : M | array embebido `Pedido.cervezas[]`, cada ítem referencia `Cerveza._id` |

Todas las relaciones son **referencias manuales por ObjectId** (no hay claves foráneas reales en MongoDB). La integridad referencial **no está garantizada por la base**: eliminar una cerveza o un usuario deja referencias huérfanas en los pedidos.

---

## 5. Índices

| Colección | Índice | Origen |
|---|---|---|
| `usuarios` | `_id` (default) | MongoDB |
| `usuarios` | `email` **unique** | `unique: true` en el schema |
| `cervezas` | `_id` (default) | MongoDB |
| `pedidos` | `_id` (default) | MongoDB |

No hay índices secundarios explícitos sobre `pedidos.usuario_id` ni `pedidos.estado`, pese a que se consultan (`getPedidosByUsuario`, filtros por estado en el frontend). A escala, conviene agregarlos.

---

## 6. Problemas conocidos del modelo

1. ✅ **Corregido (commit 5f8172e)** — **`ref` del subdocumento**: ahora es `ref: 'Cerveza'` ([Pedido.js:11](../../backEnd/models/Pedido.js#L11)), coincide con el modelo registrado, por lo que `populate('cervezas.cerveza')` ya resolvería correctamente.
2. **Sin `populate` en las queries** ⚠️ pendiente: `getAllPedidos`, `getPedidosByUsuario` y `getPedidoById` devuelven sólo ObjectIds; el frontend debe resolver nombres por su cuenta. (El `ref` ya está corregido; falta invocar `populate`.)
3. **Stock sin trazabilidad** ⚠️ pendiente: `stock_actual` se sobrescribe; no hay histórico de movimientos.
4. **Sin transacción multi-documento** ⚠️ pendiente: no se usa una transacción Mongo. ✅ Mitigado (commit 5f8172e): el descuento de stock es **atómico y condicional** (`findOneAndUpdate` con `stock_actual: { $gte: cantidad }`) con **rollback** si algún ítem falla, y se **restituye stock** al rechazar o eliminar un pedido (ver [BUSINESS_RULES §4.3](../business/BUSINESS_RULES.md#43-pedido)). Aun así no es una transacción real.
5. ✅ **Corregido (commit 5f8172e)** — **`password` ya no se retorna**: `getAllUsuariosRepository` usa `.select('-password')` y el update de usuario también excluye el hash.

> Detalle de campos y reglas funcionales en [BUSINESS_RULES §2](../business/BUSINESS_RULES.md#2-entidades). Contratos de API en [docs/api](../api/README.md).

---

_Documentación derivada de los schemas Mongoose. Última verificación: 2026-06-17._
