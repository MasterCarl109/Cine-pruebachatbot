# Roadmap: CineClub — Sistema de Cine con Reservas

## Fase actual: Refactor del modelo de funciones

### Problema detectado

El modelo `screenings` actual usa un diseño heredado de videoclub:
- Rango de fechas (`startDate`–`endDate`) + `showtimes[]` anidados
- Campo `copies` que no aplica a un cine real
- La lógica de reserva es más compleja de lo necesario

### Solución: Screening plano (una fecha + hora por documento)

```
Antes:                         Después:
screenings: [{                  screenings: [{
  store,                          store,
  startDate, endDate,             date,        // "2026-06-10"
  copies,                         time,        // "19:00"
  showtimes: [{                   totalSeats,  // 10
    time,                         bookedSeats  // 0
    totalSeats,                 }]
    bookedSeats
  }]
}]
```

Cada screening es **una función real** en una fecha y hora concreta, como en un cine.

---

## Archivos a modificar

### Backend (5 archivos)

| # | Archivo | Cambio |
|---|---------|--------|
| 1 | `backend/models/Movie.js` | Reemplazar `screeningSchema` + `showtimeSchema` por un schema plano con `{ store, date, time, totalSeats, bookedSeats }`. Eliminar `copies`. |
| 2 | `backend/seed.js` | Poblar screenings como fechas individuales (ej: 10 funciones de Inception en distintas fechas/horas/tiendas). |
| 3 | `backend/routes/movies.js` | Filtro activo: `screenings.date >= today` |
| 4 | `backend/routes/reservations.js` | Buscar screening por `{ date, time, store }`. Simplificar validaciones. |
| 5 | `backend/sockets/chatHandler.js` | Adaptar búsqueda de películas activas y cálculo de popularidad. |

### Frontend (3 archivos)

| # | Archivo | Cambio |
|---|---------|--------|
| 6 | `frontend/src/pages/EmployeePanel.jsx` | **Inventario**: eliminar columna "Copias" y formulario de edición. **Reservas**: selector único de función (fecha + hora combinados) en vez de date picker + horario. Agregar indicador "Tienda: {nombre}". |
| 7 | `frontend/src/components/catalog/MovieDetailDialog.jsx` | Eliminar columna "Copias". Mostrar funciones agrupadas por tienda con asientos libres. |
| 8 | `frontend/src/pages/AdminMovies.jsx` | CRUD de screenings: reemplazar rango de fechas + showtimes anidados por selección de fecha + hora individual. |

---

## Implementado ✅

```
 1. backend/models/Movie.js           ← nuevo schema plano (date+time) ✅
 2. backend/seed.js                   ← funciones con fechas concretas ✅
 3. backend/routes/movies.js          ← filtro date >= today ✅
 4. backend/routes/reservations.js    ← búsqueda por date+time+store ✅
 5. backend/sockets/chatHandler.js    ← adaptado a flat screenings ✅
 6. frontend/src/pages/EmployeePanel.jsx ← sin copias, selector único, tienda indicator ✅
 7. frontend/src/components/catalog/MovieDetailDialog.jsx ← sin copias, agrupado x tienda ✅
 8. frontend/src/pages/AdminMovies.jsx ← CRUD con date+time+totalSeats ✅
 9. frontend/src/components/catalog/MovieCard.jsx ← eliminado availability residual ✅
```

---

## Lo que ya está estable (no se toca)

- Modelos: `Director.js`, `Genre.js`, `Store.js`, `Client.js`, `User.js`, `Reservation.js`
- Autenticación: JWT con `type` (staff/client), dos logins separados, `ProtectedRoute`
- Chatbot con Ollama (endpoints, filtro de intención, popularidad)
- CRUDs de admin: directores, géneros, tiendas, usuarios
- Portal público: landing, catálogo, chat widget, registro de clientes
- Reservas: modelo, rutas CRUD, `/mine` para clientes

---

## Pendiente posterior

| Item | Prioridad |
|------|-----------|
| Pruebas backend (jest + supertest) | Media |
| Pruebas frontend (vitest) | Media |

## Implementado ✅

- [x] JWT en cookie httpOnly (staff + client login)
- [x] Logout con limpieza de cookie
- [x] Cookie parser en backend
- [x] Auth middleware lee de cookie primero, fallback a header
- [x] CORS con credentials específico para frontend
- [x] Socket.io CORS con credentials
- [x] Rate limiting (10 intentos / 15 min) en login staff, login cliente, registro
- [x] Store poblado en login response para mostrar nombre de tienda
- [x] Frontend: withCredentials en axios, sin localStorage token
- [x] ProtectedRoute usa user de localStorage (no token)
