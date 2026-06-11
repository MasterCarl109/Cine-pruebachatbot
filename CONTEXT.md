# Contexto del proyecto — CineClub

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js + Express 5 + Mongoose 9 + Socket.io 4 |
| Frontend | React 19 + Vite 8 + Material UI 9 + React Router 7 |
| Base de datos | MongoDB (local) |
| Chatbot | Ollama (llama3.2:1b, deepseek-r1:7b) |
| Autenticación | Sesiones opacas (crypto) + bcrypt |

## Modelos

| Colección | Propósito |
|-----------|-----------|
| `movies` | Películas con screenings por sala y ofertas embebidas |
| `directors` | Directores |
| `genres` | Géneros |
| `stores` | Tiendas con salas (5 por cine, capacidad variable) |
| `users` | Staff: admin, manager, employee |
| `clients` | Clientes con tarjeta virtual (saldo + PIN) |
| `reservations` | Reservas con tipo de boleto, monto, sala |
| `chatsessions` | Sesiones de chat manager-cliente |
| `sessions` | Sesiones de autenticación (token opaco) |

### Estructura clave

**Store**: `{ name, address, phone, rooms: [{ name, capacity }] }`

**Movie**: `{ title, price, screenings: [{ store, room, date, time, totalSeats, bookedSeats }], offers: [{ store?, description, discountPercent, startDate, endDate, active }] }`

**Client**: `{ name, email, password, active, virtualCard: { cardNumber, pin (bcrypt), balance } }`

**Reservation**: `{ movie, client, createdBy?, store, room, screeningDate, showtime, seatNumber, ticketType: adult|child, amount, paymentStatus: paid|refunded, paidAt, status: active|cancelled }`

**ChatSession**: `{ client, manager?, store, status: waiting|active|closed, messages: [{ from, text }] }`

## Roles

| Rol | Acceso |
|-----|--------|
| **admin** | CRUD todo, sin restricción de tienda. Crea ofertas globales. |
| **manager** | CRUD películas, directores, géneros, ofertas **solo en su tienda**. |
| **employee** | Inventario + reservas en su tienda. |
| **client** | Catálogo, chatbot, auto-reserva con pago, `/mis-reservas`, cancelación con reembolso. |

## Autenticación

| Endpoint | Para | Sesión type |
|----------|------|-------------|
| `POST /api/auth/login` | Staff | `type: staff` + `role` |
| `POST /api/client-auth/login` | Clientes | `type: client` |
| `POST /api/client-auth/register` | Registro público | — (genera tarjeta virtual) |

## Rutas del frontend

| Ruta | Portal | Protección |
|------|--------|-----------|
| `/` | Cliente | Público |
| `/catalogo` | Cliente | Público |
| `/login` | Cliente | Público |
| `/registro` | Cliente | Público |
| `/mis-reservas` | Cliente | `type: client` |
| `/access` | Staff | Público |
| `/panel` | Staff | `type: staff`, rol admin/manager |
| `/panel/p` | Staff | `type: staff`, rol admin/manager |
| `/panel/d` | Staff | `type: staff`, rol admin/manager |
| `/panel/g` | Staff | `type: staff`, rol admin/manager |
| `/panel/t` | Staff | `type: staff`, rol admin/manager |
| `/panel/u` | Staff | `type: staff`, rol admin |
| `/panel/e` | Staff | `type: staff`, rol employee |

## Datos de prueba (seed)

| Usuario | Pass | Rol | Notas |
|---------|------|-----|-------|
| admin@cineclub.com | admin123 | admin | Sin tienda |
| manager.centro@cineclub.com | manager123 | manager | Tienda Centro |
| manager.sur@cineclub.com | manager123 | manager | Tienda Sur |
| empleado.norte@cineclub.com | empleado123 | employee | Tienda Norte |
| cliente@cineclub.com | cliente123 | client | PIN: 123456, Tarjeta: 4000123456789012, Saldo: ~$99,590 |

## Seguridad

- Token de sesión opaco (crypto.randomBytes 32 hex) en cookie httpOnly
- Logout elimina sesión de la BD y limpia cookie
- CORS con origen específico + credentials
- Rate limiting: 10 intentos cada 15 min en login/register
- Auth middleware: lee cookie, busca sesión en MongoDB adjunta user data
- PIN de tarjeta hasheado con bcrypt
- Frontend: `withCredentials: true`, sin token en localStorage

## Refactor History

| Parte | Qué se hizo |
|-------|------------|
| **1** — Room management | CRUD de salas (`GET/POST/PUT/DELETE /stores/:id/rooms`), límite 5 por tienda, frontend AdminStores UI con room CRUD, AdminMovies con selector de sala que auto-completa capacidad. |
| **2** — Auth hardening | `sameSite: 'lax'`, helmet, `express.json({ limit: '1mb' })`, global error handler, graceful shutdown, `ALLOWED_ORIGINS` env var, removido jsonwebtoken/JWT_SECRET. |
| **3** — Race conditions & financial | Booking atómico (`updateOne` + `arrayFilters` con `$lt` capacity check), refund `findOneAndUpdate(status:'active')`, `calcPrice()` centralizado, `insertMany` reemplaza loop, `crypto.randomInt` reemplaza `Math.random()`. |
| **4** — Socket.IO Security | `io.use` middleware valida session token del modelo `Session`, chatHandler rewrite con validación `isManager()`, `clientId` extraído de `socket.user`, todos los eventos verifican auth. Frontend: `setSocketToken()`/`setManagerSocketToken()`, `GET /api/auth/socket-token` endpoint, login devuelve `socketToken`. |
| **5** — Cleanup & edge cases | Código muerto `currentUser` eliminado de ChatWidget; `AbortController` con timeout 15s en ollamaService + fallback a blacklist-only en intentFilter; MovieDetailDialog usa `useAuth()` en vez de localStorage; socket `connect_error` refresca token automático; `GET /api/auth/me` endpoint para staff. |
| **6** — ProtectedRoute verificado contra backend | AuthContext verifica sesión vía `GET /api/auth/me` (staff) o `GET /api/client-auth/me` (client) al montar; `loading` state evita renderizado prematuro; ProtectedRoute usa `useAuth()` en vez de localStorage. |

| **7** — Validación de request body | `middleware/validate.js` creado con `express-validator`. Cubre auth, clientAuth, movies, directors, genres, stores (rooms), reservations, users. Cada ruta POST/PUT valida tipos, formato email, MongoId, rangos numéricos, PIN 6 dígitos. Errores devueltos como `{ error, details }`. |

## Pendiente a futuro

- (ninguno por el momento)

## Reglas de negocio

1. **Salas**: Cada tienda tiene 5 salas con capacidad variable. No pueden existir dos screenings con el mismo `store + room + date + time`.
2. **Ofertas**: Manager solo crea ofertas para su tienda. Admin crea globales (`store = null`). Al reservar se aplica el descuento de la oferta activa (store coincide o es global).
3. **Pago**: El cliente paga con su tarjeta virtual ingresando PIN. Se descuenta del saldo. Descuento infantil 30% aplica por asiento.
4. **Reserva múltiple**: Se pueden reservar N asientos en una sola transacción, cada uno con tipo adulto o infantil.
5. **Chat**: El chatbot puede transferir la conversación a un manager. El manager recibe una notificación en su Dashboard y puede chatear en vivo.
