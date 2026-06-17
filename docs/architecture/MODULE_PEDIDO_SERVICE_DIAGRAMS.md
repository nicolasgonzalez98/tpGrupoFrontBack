# Diagramas — Módulo `pedidoService.js`

Complemento visual del análisis técnico en [MODULE_PEDIDO_SERVICE.md](MODULE_PEDIDO_SERVICE.md). Cinco diagramas Mermaid:

> **Última actualización:** 2026-06-17 (refleja el commit `5f8172e` en `main`).

1. [Flujo de datos completo (`createPedido`)](#1-flujo-de-datos--createpedido-end-to-end)
2. [Relación entre componentes (arquitectura por capas)](#2-relación-entre-componentes)
3. [Interacción entre servicios y repositorios](#3-interacción-entre-servicios)
4. [Conexión con la base de datos (modelo de datos)](#4-conexión-con-la-base-de-datos)
5. [Máquina de estados del pedido](#5-máquina-de-estados-del-pedido)
6. [Bonus — Race condition (sobreventa de stock)](#6-bonus--race-condition-en-createpedido)

---

## 1. Flujo de datos — `createPedido` end-to-end

Recorrido completo de un `POST /pedido` desde el frontend hasta MongoDB y vuelta. Las tres fases del service están marcadas como **[A]**, **[B]**, **[C]** (ver [MODULE_PEDIDO_SERVICE.md §3.1](MODULE_PEDIDO_SERVICE.md#31-createpedido--la-función-con-lógica-real)).

```mermaid
sequenceDiagram
    autonumber
    actor Cl as Cliente
    participant FE as PedidosComponent<br/>(Angular)
    participant R as pedidoRoutes
    participant Ctrl as pedidoController
    participant S as pedidoService
    participant PR as pedidoRepository
    participant CR as cervezaRepository
    participant DB as MongoDB Atlas

    Cl->>FE: Arma carrito + "Confirmar"
    FE->>R: POST /pedido<br/>Authorization: Bearer JWT<br/>{cervezas:[{cerveza, cantidad}]}
    R->>R: verifyToken + requireRole('cliente')
    R->>Ctrl: createPedido(req, res)
    Ctrl->>Ctrl: usuario_id = req.user._id (del token)<br/>Valida cervezas no vacío<br/>+ cantidad entera > 0 (si no → 400)
    Ctrl->>S: createPedido({usuario_id, cervezas, estado:'pendiente'})

    rect rgb(255, 245, 230)
    note over S,DB: [A] Validación de existencia — N queries (N+1, R6 pendiente)
    loop por cada item.cerveza
        S->>CR: getCervezaById(item.cerveza)
        CR->>DB: Cerveza.findOne({_id})
        DB-->>CR: cerveza | null
        CR-->>S: cerveza
        S->>S: Verifica que exista<br/>(stock NO se chequea aquí)
    end
    end

    rect rgb(255, 230, 230)
    note over S,DB: [B] Descuento atómico condicional + rollback manual
    loop por cada item.cerveza
        S->>CR: descontarStockSiHay(id, cantidad)
        CR->>DB: findOneAndUpdate<br/>{_id, stock_actual: {$gte: cantidad}}<br/>{$inc: {stock_actual: -cantidad}}
        DB-->>CR: doc | null
        CR-->>S: true (descontó) | false (sin stock)
        alt false → rollback
            S->>CR: restituirStock(...) de lo ya descontado
            S->>S: throw "Stock insuficiente para <nombre>"
        end
    end
    end

    rect rgb(230, 245, 255)
    note over S,DB: [C] Persistencia del pedido (rollback si falla)
    S->>PR: createPedido(pedidoData)
    PR->>DB: new Pedido(pedidoData).save()
    alt save falla
        S->>CR: restituirStock(...) de todo lo descontado
        S->>S: re-throw error
    else ok
        DB-->>PR: pedido (con _id)
        PR-->>S: pedido
    end
    end

    S-->>Ctrl: pedido
    Ctrl-->>R: res.status(201).json(pedido)
    R-->>FE: 201 Created
    FE-->>Cl: "Pedido creado"
```

> ✅ **Resuelto (commit `5f8172e`):** el descuento en **[B]** es atómico y condicional (`findOneAndUpdate` con filtro `stock_actual >= cantidad`), así que dos clientes concurrentes ya no pueden sobrevender — el segundo recibe `false` y se hace rollback. Ver [§6](#6-bonus--race-condition-en-createpedido).
> ⚠️ Aún sin transacción multi-documento real: para pedidos multi-ítem el rollback es manual (best-effort).

---

## 2. Relación entre componentes

Vista por capas (route → controller → service → repository → model → DB) y las dependencias **externas** del módulo (frontend, otros services).

```mermaid
graph TB
    subgraph Front["Frontend Angular"]
        PC[PedidosComponent]
        PSFE[PedidosService<br/>HttpClient]
        APedidos[AdministrarPedidos<br/>Component]
    end

    subgraph Routes["Backend · Routes"]
        PR[pedidoRoutes.js]
    end

    subgraph Controllers["Backend · Controllers"]
        PCtrl[pedidoController.js]
    end

    subgraph Services["Backend · Services"]
        PSv[pedidoService.js]
    end

    subgraph Repositories["Backend · Repositories"]
        PRep[pedidoRepository.js]
        CRep[cervezaRepository.js]
    end

    subgraph Models["Backend · Models (Mongoose)"]
        PM[Pedido]
        CM[Cerveza]
        UM[Usuario]
    end

    DB[(MongoDB Atlas)]

    PC -->|"createPedido(...)"| PSFE
    APedidos -->|"updatePedido / delete"| PSFE
    PSFE -->|"HTTP JSON + Bearer JWT"| PR
    PR -->|"verifyToken + requireRole"| PCtrl
    PCtrl --> PSv
    PSv -->|"CRUD Pedido"| PRep
    PSv -->|"existencia + descontarStockSiHay<br/>restituirStock"| CRep
    PRep --> PM
    CRep --> CM
    PM -.ref usuario_id.-> UM
    PM -.ref cervezas.cerveza<br/>'Cerveza' ✅ corregido.-> CM
    PM --> DB
    CM --> DB
    UM --> DB

    style PSv fill:#fde68a,stroke:#b45309,stroke-width:2px
    style CRep fill:#fed7aa,stroke:#9a3412
    style PRep fill:#fed7aa,stroke:#9a3412
```

> Resaltado en amarillo el target del análisis. En naranja, los dos repositorios que el service coordina simultáneamente (única ocurrencia en todo el backend).

---

## 3. Interacción entre servicios

Detalle del **fan-out** de llamadas que hace `pedidoService` hacia los dos repositorios. Útil para ver dónde se concentra la complejidad.

```mermaid
flowchart LR
    subgraph SVC["pedidoService"]
        CP[createPedido]
        GAP[getAllPedidos]
        GPI[getPedidoById]
        GPU[getPedidosByUsuario]
        DPI[deletePedidoById]
        UP[updatePedido]
    end

    subgraph PRep["pedidoRepository"]
        PR_C[createPedido]
        PR_GA[getAllPedidos]
        PR_GI[getPedidoById]
        PR_GU[getPedidosByUsuario]
        PR_D[deletePedidoById]
        PR_U[updatePedido]
    end

    subgraph CRep["cervezaRepository"]
        CR_GI[getCervezaById]
        CR_DH[descontarStockSiHay<br/>atómico condicional]
        CR_R[restituirStock]
        CR_D[descontarStockActualById]
    end

    CP -.fase A: existencia.-> CR_GI
    CP -.fase B: descuento.-> CR_DH
    CP -.fase B/C: rollback.-> CR_R
    CP -.fase C.-> PR_C
    GAP --> PR_GA
    GPI --> PR_GI
    GPU --> PR_GU
    DPI -.restituir si reservado.-> CR_R
    DPI --> PR_D
    UP -.rechazar: restituir.-> CR_R
    UP -.des-rechazar: re-reservar.-> CR_D
    UP --> PR_U

    style CP fill:#fde68a,stroke:#b45309,stroke-width:2px
    style DPI fill:#fde68a,stroke:#b45309
    style UP fill:#fde68a,stroke:#b45309
    style CR_DH fill:#bbf7d0,stroke:#166534
    style CR_R fill:#bbf7d0,stroke:#166534
```

Observaciones:
- **3 de 6 funciones son pass-through** (`getAllPedidos`, `getPedidoById`, `getPedidosByUsuario`). `createPedido`, `deletePedidoById` y `updatePedido` (amarillo) tienen lógica de coordinación de stock.
- Las tres funciones con lógica cruzan la frontera del agregado `Pedido` para tocar `Cerveza`.
- ✅ `descontarStockSiHay` (verde) reemplaza al `$inc` incondicional en la creación: el filtro `stock_actual >= cantidad` cierra R1. `restituirStock` (verde) implementa el rollback y la liberación de stock (R2/R3).
- ⚠️ `descontarStockActualById` (incondicional) **sigue usándose** en la **re-reserva** de `updatePedido` (des-rechazar): podría dejar stock negativo si ya no hay existencias.

---

## 4. Conexión con la base de datos

Modelo de datos en MongoDB. Las relaciones son **por referencia** (no hay FK reales en Mongo — son `ObjectId` que apuntan a `_id` de otra colección).

```mermaid
erDiagram
    USUARIO ||--o{ PEDIDO : "crea<br/>(usuario_id)"
    USUARIO ||--o{ PEDIDO : "resuelve<br/>(aprobado_por)"
    PEDIDO ||--|{ PEDIDO_ITEM : "contiene<br/>(embebido)"
    CERVEZA ||--o{ PEDIDO_ITEM : "referenciada<br/>(ref 'Cerveza' ✅ corregido)"

    USUARIO {
        ObjectId _id PK
        string nombre
        string email UK
        string password "bcrypt hash"
        enum rol "admin|empleado|cliente"
        boolean activo "default true"
        Date createdAt
        Date updatedAt
    }

    CERVEZA {
        ObjectId _id PK
        string nombre
        string tipo
        number stock_actual "default 0"
        number stock_minimo "default 0"
        boolean activo "default true"
        Date createdAt
        Date updatedAt
    }

    PEDIDO {
        ObjectId _id PK
        ObjectId usuario_id FK
        Date fecha "default Date.now"
        enum estado "pendiente|aprobado|rechazado"
        ObjectId aprobado_por FK "nullable"
        Date fecha_aprobacion "nullable"
        Date createdAt
        Date updatedAt
    }

    PEDIDO_ITEM {
        ObjectId cerveza FK "embebido en Pedido.cervezas[]"
        number cantidad
    }
```

Notas sobre el modelo:
- **`PEDIDO_ITEM` no es una colección**: vive embebido en `Pedido.cervezas[]`. Aquí está separado solo para visualizar la relación.
- ✅ **`ref: 'Cerveza'` corregido (commit `5f8172e`)** ([Pedido.js](../../backEnd/models/Pedido.js)). Coincide con el modelo registrado, así que un `.populate('cervezas.cerveza')` ya resolvería. ⏳ Pendiente: las queries de pedido **todavía no invocan `populate`**, así que en la práctica siguen devolviendo `ObjectId` sueltos.
- **No hay índices declarados** en `Pedido` (más allá del `_id`). Búsquedas por `usuario_id` y `estado` hacen full collection scan.

---

## 5. Máquina de estados del pedido

Las transiciones **siguen sin validarse** (⏳ no hay máquina de estados explícita), pero su **efecto sobre el stock ya se maneja** en `updatePedido`/`deletePedidoById` (commit `5f8172e`). Estados `pendiente`/`aprobado` mantienen stock **reservado**; `rechazado` lo **libera**.

```mermaid
stateDiagram-v2
    direction LR
    [*] --> pendiente: createPedido<br/>(stock descontado, atómico)
    pendiente --> aprobado: PATCH estado=aprobado<br/>+ fecha_aprobacion=now<br/>(sigue reservado)
    pendiente --> rechazado: PATCH estado=rechazado<br/>✅ stock RESTITUIDO
    aprobado --> rechazado: PATCH estado=rechazado<br/>✅ stock RESTITUIDO
    aprobado --> pendiente: ⏳ transición no validada<br/>(ambos reservados, stock sin cambio)
    rechazado --> aprobado: ⏳ transición no validada<br/>✅ stock RE-RESERVADO
    rechazado --> pendiente: ⏳ transición no validada<br/>✅ stock RE-RESERVADO
    aprobado --> [*]: delete → ✅ restituye stock
    rechazado --> [*]: delete → no restituye<br/>(ya estaba liberado)

    note right of pendiente
        Estado inicial.
        Stock reservado (descontado
        de forma atómica condicional).
    end note

    note right of aprobado
        fecha_aprobacion = new Date()
        aprobado_por = req.body
        Stock sigue reservado.
    end note

    note right of rechazado
        ✅ Stock restituido al entrar
        desde un estado reservado.
        Re-reservado si se sale de aquí.
    end note
```

El enum del schema (`['pendiente', 'aprobado', 'rechazado']`) restringe los **valores** pero ⏳ **no las transiciones**: un `PATCH /pedido/:id {estado:'pendiente'}` sobre un pedido `rechazado` sigue aceptándose sin validar. La diferencia respecto al estado anterior es que ahora ese cambio **re-reserva el stock** (vía `descontarStockActualById`), en vez de dejar el inventario inconsistente.

> ⚠️ Matiz: la re-reserva al des-rechazar usa el descuento **incondicional** (`descontarStockActualById`), no el condicional, por lo que podría llevar `stock_actual` a negativo si ya no hay existencias.

---

## 6. Bonus — Race condition en `createPedido` (✅ mitigada en commit `5f8172e`)

El riesgo **R1** (sobreventa de stock) **ya está mitigado**. Lo que antes figuraba como "fix propuesto" es ahora **lo implementado**: el descuento se hace con un `findOneAndUpdate` condicional (`descontarStockSiHay`), una sola operación atómica por documento. La transacción Mongo multi-documento sigue pendiente, pero para el caso de concurrencia sobre una misma cerveza el descuento atómico ya es suficiente.

### 6.1 Escenario histórico (comportamiento VIEJO, ya no ocurre)

Antes del fix, con `stock_actual = 10` y dos clientes pidiendo 7 simultáneamente la validación (lectura) y el descuento (`$inc` incondicional) eran pasos separados, lo que permitía la sobreventa:

```mermaid
sequenceDiagram
    autonumber
    participant T1 as Pedido 1<br/>(cliente A)
    participant T2 as Pedido 2<br/>(cliente B)
    participant CR as cervezaRepository
    participant DB as MongoDB<br/>stock_actual = 10

    par
        T1->>CR: getCervezaById(X)
        CR->>DB: findOne
        DB-->>CR: stock=10
        CR-->>T1: cerveza
        Note over T1: valida 10 >= 7 ✅
    and
        T2->>CR: getCervezaById(X)
        CR->>DB: findOne
        DB-->>CR: stock=10
        CR-->>T2: cerveza
        Note over T2: valida 10 >= 7 ✅
    end

    T1->>CR: descontarStockActualById(X, 7)
    CR->>DB: $inc {stock_actual: -7}
    Note over DB: stock_actual = 3

    T2->>CR: descontarStockActualById(X, 7)
    CR->>DB: $inc {stock_actual: -7}
    Note over DB: stock_actual = -4 ❌

    rect rgb(254, 226, 226)
    Note over T1,T2: Resultado (VIEJO):<br/>2 pedidos válidos persistidos<br/>+ stock_actual negativo<br/>= sobreventa real
    end
```

### 6.2 Comportamiento ACTUAL (implementado, commit `5f8172e`)

El descuento usa `descontarStockSiHay` → `findOneAndUpdate({_id, stock_actual: {$gte: cantidad}}, {$inc: {stock_actual: -cantidad}})`. "Valida + descuenta" es una única operación atómica: si el filtro `stock_actual >= cantidad` no matchea, no hay descuento y la función devuelve `false`, lo que dispara el rollback manual y el `throw`.

```mermaid
sequenceDiagram
    autonumber
    participant T1 as Pedido 1
    participant T2 as Pedido 2
    participant DB as MongoDB<br/>stock_actual = 10

    par
        T1->>DB: descontarStockSiHay → findOneAndUpdate<br/>{_id, stock_actual>=7}<br/>{$inc -7}
    and
        T2->>DB: descontarStockSiHay → findOneAndUpdate<br/>{_id, stock_actual>=7}<br/>{$inc -7}
    end

    Note over DB: T1 gana el lock atómico<br/>stock 10 → 3
    DB-->>T1: doc actualizado → true

    Note over DB: T2 evalúa: stock=3, filtro 3>=7 falla
    DB-->>T2: null → false

    rect rgb(220, 252, 231)
    Note over T1,T2: T1 persiste el pedido<br/>T2 hace rollback manual + throw "Stock insuficiente"<br/>= sin sobreventa ✅
    end
```

> ⚠️ Pendiente (ver [MODULE_PEDIDO_SERVICE.md §7](MODULE_PEDIDO_SERVICE.md#prioridad-1--correctitud)): esto **no es** una transacción multi-documento. Para pedidos con varios ítems, si un ítem posterior falla, el rollback de los anteriores es manual (best-effort). Envolver todo en `session.withTransaction` daría atomicidad total.

---

## Cómo renderizar estos diagramas

- **GitHub**: renderiza Mermaid nativamente en archivos `.md` desde 2022 — solo abrir el archivo en el repo.
- **VSCode**: con la extensión [Markdown Preview Mermaid Support](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid) en el preview (`Ctrl+Shift+V`).
- **Standalone**: copiar el bloque y pegar en [mermaid.live](https://mermaid.live).
