# Contexto del proyecto — CineClub

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js + Express 5 + Mongoose 9 + Socket.io 4 |
| Frontend | React 19 + Vite 8 + Material UI 9 + React Router 7 |
| Base de datos | MongoDB (local) |
| Chatbot | Ollama (llama3.2:1b, deepseek-r1:7b) |
| Autenticación | JWT + bcrypt |

## Modelos

| Colección | Propósito |
|-----------|-----------|
| `movies` | Películas con screenings embebidos |
| `directors` | Directores |
| `genres` | Géneros |
| `stores` | Tiendas/sucursales |
| `users` | Staff: admin, manager, employee |
| `clients` | Clientes (colección separada de users) |
| `reservations` | Reservas de boletos |

## Roles

| Rol | Acceso |
|-----|--------|
| **admin** | CRUD todo, sin restricción de tienda |
| **manager** | CRUD películas, directores, géneros en su tienda |
| **employee** | Inventario + reservas en su tienda |
| **client** | Catálogo, chatbot, `/mis-reservas` |

## Autenticación

| Endpoint | Para | JWT type |
|----------|------|----------|
| `POST /api/auth/login` | Staff | `type: staff` + `role` |
| `POST /api/client-auth/login` | Clientes | `type: client` |
| `POST /api/client-auth/register` | Registro público | — |

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

| Usuario | Pass | Rol |
|---------|------|-----|
| admin@cineclub.com | admin123 | admin |
| manager.centro@cineclub.com | manager123 | manager (Centro) |
| manager.sur@cineclub.com | manager123 | manager (Sur) |
| empleado.norte@cineclub.com | empleado123 | employee (Norte) |
| cliente@cineclub.com | cliente123 | client |

## Seguridad implementada

- Token de sesión opaco (crypto.randomBytes 32 hex) en cookie httpOnly — **no es un JWT**, no se puede decodificar
- Logout con endpoint que elimina la sesión de la BD y limpia la cookie
- CORS configurado con origen específico + credentials
- Rate limiting: 10 intentos cada 15 min en login/register
- Auth middleware: lee cookie, busca sesión en MongoDB adjunta user data
- Store poblado (`.populate('store', 'name')`) en login staff
- Frontend: `withCredentials: true`, sin token en localStorage
- ProtectedRoute verifica `user` en localStorage (no token)

## Refactor de screenings (completado)

### Antes
```js
screenings: [{
    store, startDate, endDate,     // rango de días + showtimes anidados
    copies,                        // no aplica a cine
    showtimes: [{ time, totalSeats, bookedSeats }]
}]
```

### Después
```js
screenings: [{
    store,                         // tienda
    date: Date,                    // fecha concreta: 2026-06-10
    time: String,                  // "16:00", "19:00", "22:00"
    totalSeats: Number,            // 10
    bookedSeats: Number            // 0
}]
```

Archivos modificados (todos completados):
1. ✅ `backend/models/Movie.js`
2. ✅ `backend/seed.js`
3. ✅ `backend/routes/movies.js`
4. ✅ `backend/routes/reservations.js`
5. ✅ `backend/sockets/chatHandler.js`
6. ✅ `frontend/src/pages/EmployeePanel.jsx`
7. ✅ `frontend/src/components/catalog/MovieDetailDialog.jsx`
8. ✅ `frontend/src/pages/AdminMovies.jsx`
9. ✅ `frontend/src/components/catalog/MovieCard.jsx` (eliminado availability residual)
