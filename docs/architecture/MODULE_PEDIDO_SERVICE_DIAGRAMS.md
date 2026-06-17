# Diagramas — Módulo `pedidoService.js`

Complemento visual del análisis técnico en [MODULE_PEDIDO_SERVICE.md](MODULE_PEDIDO_SERVICE.md). Cinco diagramas Mermaid:

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
    FE->>R: POST /pedido<br/>{usuario_id, cervezas:[{cerveza, cantidad}]}
    R->>Ctrl: createPedido(req, res)
    Ctrl->>Ctrl: Valida body<br/>(usuario_id, cervezas no vacío)
    Ctrl->>S: createPedido({...body, estado:'pendiente'})

    rect rgb(255, 245, 230)
    note over S,DB: [A] Validación — N queries (N+1)
    loop por cada item.cerveza
        S->>CR: getCervezaById(item.cerveza)
        CR->>DB: Cerveza.findOne({_id})
        DB-->>CR: cerveza | null
        CR-->>S: cerveza
        S->>S: Verifica existencia<br/>+ stock_actual >= cantidad
    end
    end

    rect rgb(255, 230, 230)
    note over S,DB: [B] Descuento — sin transacción
    loop por cada item.cerveza
        S->>CR: descontarStockActualById(id, cantidad)
        CR->>DB: findByIdAndUpdate<br/>{$inc: {stock_actual: -cantidad}}
        DB-->>CR: cerveza actualizada
        CR-->>S: ok
    end
    end

    rect rgb(230, 245, 255)
    note over S,DB: [C] Persistencia del pedido
    S->>PR: createPedido(pedidoData)
    PR->>DB: new Pedido(pedidoData).save()
    DB-->>PR: pedido (con _id)
    PR-->>S: pedido
    end

    S-->>Ctrl: pedido
    Ctrl-->>R: res.status(201).json(pedido)
    R-->>FE: 201 Created
    FE-->>Cl: "Pedido creado"
```

> ⚠️ Entre **[A] y [B]** no hay candado: si dos clientes llaman simultáneamente, ambos pueden pasar la validación con el mismo `stock_actual` y descontar de más. Ver [§6](#6-bonus--race-condition-en-createpedido).

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
    PSFE -->|HTTP JSON| PR
    PR --> PCtrl
    PCtrl --> PSv
    PSv -->|"CRUD Pedido"| PRep
    PSv -->|"validar + descontar stock"| CRep
    PRep --> PM
    CRep --> CM
    PM -.ref usuario_id.-> UM
    PM -.ref cervezas.cerveza<br/>BUG cervezas.-> CM
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
        CR_D[descontarStockActualById]
    end

    CP -.fase A.-> CR_GI
    CP -.fase B.-> CR_D
    CP -.fase C.-> PR_C
    GAP --> PR_GA
    GPI --> PR_GI
    GPU --> PR_GU
    DPI --> PR_D
    UP --> PR_U

    style CP fill:#fde68a,stroke:#b45309,stroke-width:2px
    style CR_D fill:#fca5a5,stroke:#991b1b
```

Observaciones:
- **5 de 6 funciones son pass-through** al repositorio. Solo `createPedido` tiene lógica real.
- `createPedido` es la **única** que cruza la frontera del agregado `Pedido` para tocar `Cerveza`.
- `descontarStockActualById` (rojo) es el punto donde se materializa el riesgo R1: ningún filtro condicional, solo `$inc`.

---

## 4. Conexión con la base de datos

Modelo de datos en MongoDB. Las relaciones son **por referencia** (no hay FK reales en Mongo — son `ObjectId` que apuntan a `_id` de otra colección).

```mermaid
erDiagram
    USUARIO ||--o{ PEDIDO : "crea<br/>(usuario_id)"
    USUARIO ||--o{ PEDIDO : "resuelve<br/>(aprobado_por)"
    PEDIDO ||--|{ PEDIDO_ITEM : "contiene<br/>(embebido)"
    CERVEZA ||--o{ PEDIDO_ITEM : "referenciada<br/>(ref BUG: 'cervezas')"

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
- **`ref: 'cervezas'` apunta a un modelo que no existe** ([Pedido.js:11](../../backEnd/models/Pedido.js#L11)). El modelo está registrado como `'Cerveza'`. Cualquier `.populate('cervezas.cerveza')` va a fallar silenciosamente.
- **No hay índices declarados** en `Pedido` (más allá del `_id`). Búsquedas por `usuario_id` y `estado` hacen full collection scan.

---

## 5. Máquina de estados del pedido

Transiciones permitidas (en azul) y transiciones que **no están bloqueadas pero deberían estarlo** (en rojo).

```mermaid
stateDiagram-v2
    direction LR
    [*] --> pendiente: createPedido<br/>(stock descontado)
    pendiente --> aprobado: PATCH estado=aprobado<br/>+ fecha_aprobacion=now
    pendiente --> rechazado: PATCH estado=rechazado<br/>⚠️ stock NO restituido
    aprobado --> pendiente: ❌ permitido hoy
    aprobado --> rechazado: ❌ permitido hoy
    rechazado --> aprobado: ❌ permitido hoy
    rechazado --> pendiente: ❌ permitido hoy
    aprobado --> [*]
    rechazado --> [*]

    note right of pendiente
        Estado inicial.
        Stock ya descontado.
    end note

    note right of aprobado
        fecha_aprobacion = new Date()
        aprobado_por = req.body
    end note

    note right of rechazado
        BUG: stock no se restituye
    end note
```

El enum del schema (`['pendiente', 'aprobado', 'rechazado']`) restringe los **valores** pero no las **transiciones**. Hoy un `PATCH /pedido/:id {estado:'pendiente'}` sobre un pedido `rechazado` es aceptado sin validar.

---

## 6. Bonus — Race condition en `createPedido`

Visualización del riesgo **R1** (sobreventa de stock). Escenario: `stock_actual = 10`, dos clientes piden 7 unidades simultáneamente.

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
    Note over T1,T2: Resultado:<br/>2 pedidos válidos persistidos<br/>+ stock_actual negativo<br/>= sobreventa real
    end
```

**Fix propuesto** (ver [MODULE_PEDIDO_SERVICE.md §7](MODULE_PEDIDO_SERVICE.md#prioridad-1--correctitud)): reemplazar las dos fases por un `findOneAndUpdate` con filtro condicional dentro de una transacción Mongo. Esto convierte "valida + descuenta" en una única operación atómica: si el filtro `stock_actual >= cantidad` no matchea, el descuento no ocurre y la transacción falla.

```mermaid
sequenceDiagram
    autonumber
    participant T1 as Pedido 1
    participant T2 as Pedido 2
    participant DB as MongoDB<br/>stock_actual = 10

    par
        T1->>DB: findOneAndUpdate<br/>{_id, stock_actual>=7}<br/>{$inc -7}
    and
        T2->>DB: findOneAndUpdate<br/>{_id, stock_actual>=7}<br/>{$inc -7}
    end

    Note over DB: T1 gana el lock<br/>stock 10 → 3
    DB-->>T1: cerveza actualizada

    Note over DB: T2 evalúa: stock=3, filtro 3>=7 falla
    DB-->>T2: null

    rect rgb(220, 252, 231)
    Note over T1,T2: T1 persiste el pedido<br/>T2 hace throw → rollback de la transacción<br/>= sin sobreventa
    end
```

---

## Cómo renderizar estos diagramas

- **GitHub**: renderiza Mermaid nativamente en archivos `.md` desde 2022 — solo abrir el archivo en el repo.
- **VSCode**: con la extensión [Markdown Preview Mermaid Support](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid) en el preview (`Ctrl+Shift+V`).
- **Standalone**: copiar el bloque y pegar en [mermaid.live](https://mermaid.live).
