# CineClub Frontend

Frontend React + Vite con Material Design para el asistente virtual CineClub.

---

## Estado del proyecto

| Fase | Estado |
|------|--------|
| **Fase 5 — Frontend Público** (galería, filtros, chat widget) | ✅ Completada |
| **Fase 6 — Panel Admin** (login, CRUD movies/directors/genres/stores) | ✅ Completada |

---

## Estructura

```
frontend/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.jsx        # Barra de navegación superior
│   │   │   └── Layout.jsx        # Layout principal
│   │   ├── catalog/
│   │   │   ├── MovieCard.jsx      # Tarjeta de película
│   │   │   ├── MovieGrid.jsx      # Grid de películas con carga
│   │   │   └── Filters.jsx        # Filtros: búsqueda, género, tienda
│   │   └── chat/
│   │       └── ChatWidget.jsx     # Widget flotante de chat (Socket.io)
│   ├── pages/
│   │   ├── Login.jsx              # Login admin
│   │   ├── AdminDashboard.jsx     # Dashboard admin
│   │   ├── AdminMovies.jsx        # CRUD películas
│   │   ├── AdminDirectors.jsx     # CRUD directores
│   │   ├── AdminGenres.jsx        # CRUD géneros
│   │   └── AdminStores.jsx        # CRUD tiendas
│   ├── services/
│   │   ├── api.js                 # Axios con JWT interceptor
│   │   └── socket.js              # Cliente Socket.io
│   ├── context/
│   │   └── AuthContext.jsx        # Contexto de autenticación
│   ├── theme.js                   # Tema Material UI
│   ├── App.jsx                    # Router principal
│   └── main.jsx                   # Entry point
├── index.html
├── package.json
└── vite.config.js
```

---

## Instalación y ejecución

```bash
cd frontend
npm install
npm run dev
```

El servidor de desarrollo arrancará en `http://localhost:5173`.

Asegúrate de que el backend esté corriendo en `http://localhost:3000`.

---

## Rutas

| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/` | Público | Galería de películas con filtros |
| `/login` | Público | Inicio de sesión admin |
| `/admin` | Admin | Dashboard del panel de administración |
| `/admin/movies` | Admin | CRUD de películas |
| `/admin/directors` | Admin | CRUD de directores |
| `/admin/genres` | Admin | CRUD de géneros |
| `/admin/stores` | Admin | CRUD de tiendas |

---

## Funcionalidades

### Público
- **Galería de películas** con diseño Material Design (MUI)
- **Filtros**: búsqueda por texto, género y tienda
- **Chat widget flotante**: ícono en la esquina inferior derecha, se abre como ventana de chat conectada por Socket.io al backend con Ollama

### Admin
- **Login** con email/contraseña, JWT almacenado en localStorage
- **Dashboard** con acceso a cada sección CRUD
- **CRUD completo** para películas, directores, géneros y tiendas
- **Gestión de disponibilidad** de películas por tienda
- **Protección de rutas**: redirección a `/login` si no hay token

---

## Tecnologías

- **React** + **Vite**
- **Material UI (MUI)** — componentes Material Design
- **React Router DOM** — enrutamiento
- **Axios** — peticiones HTTP con interceptor JWT
- **Socket.io Client** — chat en tiempo real
