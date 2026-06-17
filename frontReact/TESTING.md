# Guía de testing manual — frontReact

Plan de pruebas paso a paso para verificar la paridad funcional del front migrado a React contra el backend existente. Marcá cada `[ ]` a medida que avanzás.

> Objetivo: confirmar que la app React (`frontReact/`, puerto 4201) se comporta igual que la Angular original (`frontEnd/`, puerto 4200), consumiendo el mismo backend (puerto 3000).

---

## 0. Preparación del entorno

### 0.1 Backend

```bash
cd backEnd
npm install        # solo la primera vez
npm run dev        # nodemon → http://localhost:3000
```

- [ ] La consola muestra `MongoDB conectado ✅` y `Servidor escuchando en http://localhost:3000`.
- [ ] Existe `backEnd/.env` con `PORT=3000`, `DB_USER` y `DB_PASSWORD`. (Sin esto el backend no conecta.)

> ⚠️ Si no arranca: revisá que el `.env` esté presente y que el cluster de Mongo Atlas acepte tu IP.

### 0.2 Frontend React

```bash
cd frontReact
npm install        # solo la primera vez
npm run dev        # Vite → http://localhost:4201
```

- [ ] Vite muestra `Local: http://localhost:4201/`.
- [ ] Al abrir `http://localhost:4201` redirige a `/login` (porque no hay sesión).

### 0.3 (Opcional) Angular original para comparar

```bash
cd frontEnd
npm start          # ng serve → http://localhost:4200
```

- [ ] Podés abrir ambas pestañas (4200 Angular / 4201 React) y comparar lado a lado.

---

## 1. Datos de prueba necesarios

Para cubrir los 3 roles necesitás al menos:

- [ ] 1 usuario **cliente** (se crea desde el registro público).
- [ ] 1 usuario **admin** (si no existe, hay que crearlo en la base o promover un usuario vía otro admin).
- [ ] 1 usuario **empleado** (lo crea un admin desde "Registrar empleado", o se promueve desde "Gestionar usuarios").
- [ ] Al menos 2–3 **cervezas** cargadas con stock (las crea un admin/empleado).

> Nota: el registro público siempre crea rol `cliente`. El primer `admin` normalmente se siembra manualmente en Mongo (colección `usuarios`, campo `rol: "admin"`).

---

## 2. Autenticación y sesión

### 2.1 Registro de cliente
1. Ir a `/register` (o desde Login → "Registrate acá").
2. Dejar campos vacíos y tocar fuera de cada uno.
   - [ ] Aparecen los mensajes: "El nombre es obligatorio.", "El email es obligatorio.", "La contraseña es obligatoria.".
3. Cargar un email con formato inválido (`abc`).
   - [ ] Muestra "El email no es válido.".
4. Completar nombre, email válido y contraseña → "Registrarse".
   - [ ] Redirige a `/login` y aparece el diálogo **"¡Registro exitoso!"**.
   - [ ] La URL queda en `/login` sin `?registrado=true` (se limpió el query param).
5. Registrar de nuevo con el **mismo email**.
   - [ ] Muestra error "El email ya está registrado".

### 2.2 Login
1. En `/login`, ingresar credenciales **incorrectas**.
   - [ ] Muestra mensaje de error en rojo (p. ej. "Contraseña incorrecta" / "Usuario no encontrado").
   - [ ] (Nota de paridad: el backend responde HTTP 500 en todos los fallos de login; el mensaje sí distingue el caso.)
2. Ingresar credenciales **correctas**.
   - [ ] Redirige a `/` (Home) y aparece la **navbar** arriba.
3. Estando logueado, intentar ir manualmente a `/login` o `/register`.
   - [ ] Te redirige a `/` (GuestRoute).

### 2.3 Persistencia y logout
1. Con sesión iniciada, **recargar** la página (F5).
   - [ ] Seguís logueado (token/usuario en `localStorage`).
2. Click en "Cerrar sesión" (navbar).
   - [ ] Redirige a `/login` y la navbar desaparece.
3. Tras el logout, intentar entrar a una ruta protegida (ej. `/` o `/stock`) escribiéndola en la URL.
   - [ ] Te redirige a `/login`.

---

## 3. Control de acceso por rol (guards)

Probar con cada rol, escribiendo las URLs a mano:

| Ruta | cliente | empleado | admin |
|---|:-:|:-:|:-:|
| `/` (Home) | ✅ ve sección Pedidos | ✅ ve sección Stock | ✅ ve Admin + Stock |
| `/stock`, `/stock/crearCerveza`, `/stock/administrar-pedidos` | ❌ → `/` | ✅ | ✅ |
| `/admin`, `/admin/usuarios`, `/admin/crear-empleado` | ❌ → `/` | ❌ → `/` | ✅ |
| `/pedidos`, `/pedidos/mis-pedidos` | ✅ | ❌ → `/` | ❌ → `/` |

- [ ] Cliente: al intentar `/stock` o `/admin` → vuelve a `/`.
- [ ] Empleado: al intentar `/admin` → vuelve a `/`; al intentar `/pedidos` → vuelve a `/`.
- [ ] Admin: al intentar `/pedidos` → vuelve a `/`.
- [ ] Una ruta inexistente (ej. `/cualquier-cosa`) → redirige a `/`.

---

## 4. Navbar (menú por rol)

- [ ] **Cliente** ve el menú "Pedidos" (Realizar pedido / Ver mis pedidos).
- [ ] **Empleado** ve "Stock" (Ver stock / Agregar cerveza / Administrar pedidos).
- [ ] **Admin** ve "Stock" + "Administrador" (Panel de admin / Registrar empleado).
- [ ] Al pasar el mouse sobre un ítem se despliega el submenú; al salir, se oculta.
- [ ] Los links del submenú navegan a la ruta correcta.

---

## 5. Flujo Cliente — Pedidos

### 5.1 Home cliente
1. Login como cliente → Home.
   - [ ] Se ve la sección "Pedidos" con las cards "Realizar Pedido" y "Ver Mis Pedidos".

### 5.2 Realizar pedido (`/pedidos`)
1. Entrar a "Realizar pedido".
   - [ ] Se listan las cervezas como cards (nombre, tipo, stock actual).
   - [ ] Una cerveza con `stock_actual <= stock_minimo` muestra "Sin Stock" en vez del botón.
2. Click en "Agregar al carrito" en una cerveza.
   - [ ] (Sin feedback visible salvo que ya esté agregada).
3. Agregar la **misma** cerveza otra vez.
   - [ ] Toast amarillo "Atención — Cerveza ya sumada".
4. Abrir el carrito (botón con ícono de carrito, arriba a la derecha).
   - [ ] Se abre el panel lateral "Carrito" con los ítems.
5. Usar los botones **+ / −** de cantidad.
   - [ ] La cantidad sube/baja; no baja de 1.
6. Click en "Quitar" en un ítem → confirmar.
   - [ ] Aparece diálogo de confirmación; al aceptar, toast verde "Eliminado" y el ítem desaparece.
7. Con al menos 1 ítem, click "Confirmar pedido".
   - [ ] Toast verde "Pedido Creado"; el carrito queda vacío.
8. Intentar pedir **más cantidad que el stock** disponible y confirmar.
   - [ ] Toast rojo "No se pudo crear el pedido" (el backend rechaza por "Stock insuficiente").

### 5.3 Mis pedidos (`/pedidos/mis-pedidos`)
1. Entrar a "Ver mis pedidos".
   - [ ] Se ven los pedidos del cliente con estado (pendiente en amarillo), fecha (dd/MM/yyyy) y la lista de cervezas (nombre/tipo/cantidad).
   - [ ] Si no hay pedidos: "No tenés pedidos realizados.".

---

## 6. Flujo Empleado/Admin — Stock

### 6.1 Listado (`/stock`)
1. Login como empleado o admin → menú Stock → "Ver stock".
   - [ ] Tabla con columnas: Nombre, Tipo, Stock Actual, Stock Mínimo, Activo (Sí/No con color), Acciones.

### 6.2 Crear cerveza
1. "Agregar Cerveza" (o `/stock/crearCerveza`).
2. Guardar con nombre/tipo vacíos.
   - [ ] Muestra "El nombre es obligatorio." / "El tipo es obligatorio.".
3. Completar y "Guardar".
   - [ ] Redirige a `/stock` y aparece el diálogo "¡Exito!" ("La cerveza fue creada correctamente.").
   - [ ] La nueva cerveza aparece en la tabla.

### 6.3 Editar cerveza
1. En una fila, "Editar".
   - [ ] El formulario se abre con los datos cargados.
2. Cambiar algún campo (ej. stock) y "Guardar".
   - [ ] Redirige a `/stock` con diálogo "La cerveza fue editada correctamente.".
   - [ ] El cambio se refleja en la tabla.
3. Probar stock negativo (`-5`) — si el `InputNumber` lo permite, guardar.
   - [ ] El backend rechaza (no se actualiza / muestra error).

### 6.4 Eliminar cerveza
1. "Eliminar" en una fila → confirmar.
   - [ ] Diálogo "Confirmar eliminación" con botón "Sí" en rojo; al aceptar, la cerveza desaparece de la tabla.

---

## 7. Flujo Empleado/Admin — Administrar pedidos

`/stock/administrar-pedidos` (menú Stock → "Administrar pedidos").

1. Entrar.
   - [ ] Se ve "Total de pedidos: N" y una card por pedido (ID, estado coloreado, fecha, usuario, cervezas con Id/Nombre/Tipo/Cantidad).
   - [ ] Si no hay: "No hay pedidos para administrar.".
2. En un pedido **pendiente**, click "Aceptar" → confirmar.
   - [ ] Diálogo de confirmación; al aceptar, toast verde "Pedido actualizado correctamente"; el estado pasa a "aprobado" (verde).
3. En un pedido **pendiente o aprobado**, click "Rechazar" → confirmar.
   - [ ] El estado pasa a "rechazado" (rojo).
4. Click "Eliminar" en un pedido.
   - [ ] Toast verde "Pedido eliminado correctamente"; el pedido desaparece.
5. Como cliente, volver a "Mis pedidos".
   - [ ] El estado del pedido refleja lo resuelto por el empleado (aprobado/rechazado).

> Nota de paridad: al rechazar/eliminar un pedido el stock **no** se restituye (igual que el sistema original).

---

## 8. Flujo Admin — Usuarios

### 8.1 Panel (`/admin`)
1. Login como admin → "Panel de admin".
   - [ ] Dos cards: "Gestionar Usuarios" y "Registrar Usuario".

### 8.2 Registrar empleado (`/admin/crear-empleado`)
1. Entrar desde la card "Registrar Usuario".
   - [ ] El título dice "Registrar Empleado" y aparece el subtítulo de alta de empleado.
2. Completar y "Registrar Empleado".
   - [ ] Redirige a `/admin` y muestra el diálogo "El empleado fue registrado correctamente.".
3. Verificar el nuevo empleado en "Gestionar Usuarios".
   - [ ] Aparece con rol `empleado`.

### 8.3 Gestionar usuarios (`/admin/usuarios`)
1. Entrar.
   - [ ] Tabla con Nombre, Email, Rol, Activo (badge verde/rojo), Acciones.
2. Click "Editar" en un usuario.
   - [ ] Modal "Editar Usuario" con nombre/email precargados.
   - [ ] Vaciar nombre/email inválido muestra los errores; "Guardar Cambios" deshabilitado de hecho (no guarda).
3. Cambiar nombre/email → "Guardar Cambios".
   - [ ] El modal se cierra y la fila se actualiza.
4. Click "Desactivar" / "Activar".
   - [ ] El badge Activo cambia (Sí ↔ No).
   - [ ] Un usuario desactivado **no puede loguearse** (probar en `/login`).
5. Cambiar el rol con el `select` y "Guardar Rol".
   - [ ] El rol de la fila se actualiza.

---

## 9. Comparación visual contra Angular (opcional)

Con ambas apps levantadas (4200 vs 4201), recorrer las mismas pantallas y verificar que:

- [ ] La estructura/posición de los elementos coincide.
- [ ] Los textos, títulos y mensajes son los mismos.
- [ ] Los flujos (redirecciones, diálogos, toasts) se comportan igual.

> Diferencia esperada: el **tema** (React usa Lara, Angular usa Aura) puede variar levemente en colores/acentos. No es un bug; es una limitación de versión de PrimeReact estable.

---

## 10. Registro de hallazgos

Si algo no coincide con el Angular original, anotalo acá para corregirlo:

| # | Pantalla / paso | Qué esperaba | Qué pasó | Severidad |
|---|---|---|---|---|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |

---

_Notas de paridad conocidas (no son bugs de la migración, vienen del sistema original):_
- _El JWT no se envía al backend; la autorización real es solo del lado del cliente (guards)._
- _Patrón N+1 al cargar las cervezas de cada pedido (una request por ítem)._
- _Navegación con recarga completa en navbar/home (usaban `href`), y SPA en stock (usaba `routerLink`)._
