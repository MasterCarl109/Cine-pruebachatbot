# Roadmap: CineClub v2 — Sistema Multi-Rol con Reservas

## Estado actual (implementado)

El sistema completo con:
- **5 roles** (admin, manager, employee, client) con autenticación JWT y control de acceso por tienda
- **Películas** con screenings (fecha inicio/fin + copias), showtimes (16:00, 19:00, 22:00) y control de aforo (10 asientos por función)
- **Búsqueda** por palabras clave + género + tienda + texto completo + películas activas por fecha
- **Chatbot** con Ollama que usa datos reales de la BD e incluye métricas de popularidad (película más reservada, asientos libres, etc.)
- **Sistema de reservas** (crear, cancelar, listar con filtros, verificar asientos)
- **Panel de empleado** con inventario + mapa de asientos para reservas en mostrador
- **Portal público** con catálogo, filtros, modal de detalles con horarios y asientos libres
- **Portal staff** con dashboard y navbar adaptado por rol (admin/manager/employee)
- **Registro de clientes** (role: client) con login unificado
- **Widget de chat** flotante con Socket.io + indicador "escribiendo..."
- **Integración WhatsApp** como canal adicional de contacto

---

## Próxima fase: Reservas del Cliente y Calidad

### Objetivo

Completar la experiencia del cliente con su panel de reservas y agregar pruebas automatizadas para asegurar la calidad del sistema.

---

## Roles del sistema (actualizados)

| Rol | Permisos |
|-----|----------|
| **admin** | CRUD completo (películas, directores, géneros, tiendas, usuarios). Sin restricción de tienda. |
| **manager** | CRUD películas, directores, géneros + screenings en tiendas que administra. No gestiona usuarios. |
| **employee** | Ver inventario de su tienda, modificar copias/fechas de screenings, **hacer reservas** para clientes en su tienda. |
| **client** | Ver catálogo público con buscador + chatbot + (futuro) ver sus reservas. |

---

## Páginas del sistema

| Ruta | Rol | Descripción |
|------|-----|-------------|
| `/` | Público | Landing page con features destacados. |
| `/catalogo` | Público | Catálogo de películas activas con buscador y filtros. Modal con detalles, horarios y asientos. Chatbot flotante. |
| `/login` | Público | Login para clientes (tema oscuro). |
| `/registro` | Público | Registro de nuevos clientes. |
| `/staff/login` | Público | Login para staff (admin, manager, employee). |
| `/staff` | admin, manager | Dashboard con cards según rol. |
| `/staff/peliculas` | admin, manager | CRUD películas con screenings + showtimes. |
| `/staff/directores` | admin, manager | CRUD directores. |
| `/staff/generos` | admin, manager | CRUD géneros. |
| `/staff/tiendas` | admin, manager | CRUD tiendas. |
| `/staff/usuarios` | admin | CRUD empleados y managers. |
| `/staff/empleado` | employee | Panel con pestañas: (1) Inventario/screenings, (2) Hacer reservas. |
| `/mis-reservas` | client | (Futuro) Lista de reservas del cliente. |

---

## Lo implementado (checklist)

### Backend ✅

| Archivo | Acción | Estado |
|---------|--------|--------|
| `backend/models/Movie.js` | Showtimes en screeningSchema | ✅ |
| `backend/models/Reservation.js` | Modelo de reserva | ✅ |
| `backend/routes/reservations.js` | CRUD de reservas (crear, cancelar, listar, mine, check-seat) | ✅ |
| `backend/server.js` | Ruta `/api/reservations` montada | ✅ |
| `backend/sockets/chatHandler.js` | Popularidad + asientos libres en contexto | ✅ |
| `backend/services/ollamaService.js` | Popularidad formateada en el prompt | ✅ |
| `backend/seed.js` | Showtimes + reservas de muestra | ✅ |

### Frontend ✅

| Archivo | Acción | Estado |
|---------|--------|--------|
| `frontend/src/services/api.js` | Endpoints de reservas | ✅ |
| `frontend/src/pages/EmployeePanel.jsx` | Pestaña "Reservas" con mapa de asientos | ✅ |
| `frontend/src/components/catalog/MovieDetailDialog.jsx` | Modal con detalles, showtimes, asientos libres | ✅ |
| `frontend/src/components/catalog/MovieGrid.jsx` | Apertura del modal al hacer clic | ✅ |

---

## Pendiente

| Item | Prioridad | Archivos afectados |
|------|-----------|-------------------|
| **Página "Mis Reservas" para clientes** | Alta | `frontend/src/pages/ClientReservations.jsx`, `frontend/src/App.jsx` | ✅ Completado |
| **Pruebas backend** (jest + supertest) | Media | Nuevos archivos de test |
| **Pruebas frontend** (vitest) | Media | Nuevos archivos de test |
| **Endpoint público de catálogo** (sin auth) | Baja | `backend/routes/movies.js` (GET / no requiere auth, revisar) |

---

## Notas técnicas (vigentes)

- Los asientos son siempre números del 1 al 10
- No hay mapa de sala configurable (para prueba siempre 10 asientos)
- La fecha de la reserva debe estar dentro del rango `startDate - endDate` del screening
- El empleado solo puede hacer reservas en su tienda asignada
- El cliente debe estar registrado (role: client) para que el empleado lo busque por email
- El rol `client` se crea vía `/registro` público
