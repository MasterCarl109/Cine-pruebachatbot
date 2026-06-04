# CineClub Backend

Backend del asistente virtual de CineClub, una cadena de videoclubs.  
Sistema de catálogo con chatbot impulsado por Ollama + Socket.io en tiempo real.

---

## Estado del proyecto

| Fase | Estado |
|------|--------|
| **Fase 1 — Fundación** (server, modelos, conexión DB, auth, seed) | ✅ Completada |
| **Fase 2 — CRUD Admin** (rutas protegidas para movies/directors/genres/stores) | ✅ Completada |
| **Fase 3 — Servicio Ollama** (ollamaService + intentFilter) | ✅ Completada |
| **Fase 4 — Chat en tiempo real** (chatHandler con Ollama + búsqueda en BD) | ✅ Completada |

---

## Estructura del proyecto

```
backend/
├── server.js              # Entry point: Express + Socket.io + MongoDB
├── .env                    # Variables de entorno
├── package.json
├── config/
│   └── db.js               # Conexión a MongoDB con Mongoose
├── models/
│   ├── Movie.js             # Schema con índice de texto (title, synopsis)
│   ├── Director.js          # Schema con índice de texto (name)
│   ├── Genre.js             # Schema (name único)
│   ├── Store.js             # Schema (name, address, phone)
│   └── User.js              # Schema con bcrypt + comparePassword
├── services/
│   ├── ollamaService.js      # generateResponse() + classifyIntent()
│   └── intentFilter.js       # isCatalogRelated() con blacklist + clasificación Ollama
├── sockets/
│   └── chatHandler.js       # Eventos Socket.io: send_message → filtro → búsqueda → Ollama → respuesta
├── routes/
│   ├── auth.js               # POST /api/auth/login
│   ├── movies.js             # CRUD películas (protegido)
│   ├── directors.js          # CRUD directores (protegido)
│   ├── genres.js             # CRUD géneros (protegido)
│   └── stores.js             # CRUD tiendas (protegido)
├── middleware/
│   └── auth.js              # Middleware JWT (verifica token + rol admin)
└── seed.js                  # Poblado inicial de la BD con datos de prueba
```

---

## Requisitos

- **Node.js** >= 18
- **MongoDB** corriendo en `localhost:27017` (o configura `MONGODB_URI` en `.env`)
- **Ollama** (opcional por ahora, necesario para Fase 3+)

---

## Instalación y ejecución

```bash
# 1. Instalar dependencias
cd backend
npm install

# 2. Configurar variables de entorno
#    Editar backend/.env con tus valores

# 3. Poblar la base de datos con datos de prueba
npm run seed

# 4. Iniciar servidor en modo desarrollo
npm run dev
```

El servidor arrancará en `http://localhost:3000`.

---

## Variables de entorno (`.env`)

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `PORT` | Puerto del servidor | `3000` |
| `MONGODB_URI` | URI de conexión MongoDB | `mongodb://localhost:27017/cineclub` |
| `OLLAMA_URL` | URL de la API de Ollama | `http://localhost:11434` |
| `OLLAMA_MODEL` | Modelo de Ollama a usar | `llama3.2` |
| `JWT_SECRET` | Secreto para firmar tokens JWT | `your-secret-key-change-in-production` |

---

## API disponible

### Públicas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Health check del servicio |
| POST | `/api/auth/login` | Inicio de sesión admin → devuelve JWT |

### Protegidas (requieren `Authorization: Bearer <token>`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/movies?genre=&store=&search=` | Listar películas (con filtros opcionales) |
| GET | `/api/movies/:id` | Obtener película por ID |
| POST | `/api/movies` | Crear película |
| PUT | `/api/movies/:id` | Actualizar película |
| DELETE | `/api/movies/:id` | Eliminar película |
| GET | `/api/directors?search=` | Listar directores |
| GET | `/api/directors/:id` | Obtener director por ID |
| POST | `/api/directors` | Crear director |
| PUT | `/api/directors/:id` | Actualizar director |
| DELETE | `/api/directors/:id` | Eliminar director |
| GET | `/api/genres` | Listar géneros |
| GET | `/api/genres/:id` | Obtener género por ID |
| POST | `/api/genres` | Crear género |
| PUT | `/api/genres/:id` | Actualizar género |
| DELETE | `/api/genres/:id` | Eliminar género |
| GET | `/api/stores` | Listar tiendas |
| GET | `/api/stores/:id` | Obtener tienda por ID |
| POST | `/api/stores` | Crear tienda |
| PUT | `/api/stores/:id` | Actualizar tienda |
| DELETE | `/api/stores/:id` | Eliminar tienda |

---

## WebSocket (Socket.io)

### Eventos implementados

| Evento | Dirección | Descripción |
|--------|-----------|-------------|
| `send_message` | Cliente → Servidor | Envía un mensaje al chat |
| `bot_response` | Servidor → Cliente | Respuesta del asistente CineClub |
| `bot_typing` | Servidor → Cliente | Indicador de escritura (`{ typing: true/false }`) |

---

## Modelos de datos

### Movie
```
title: String (requerido)
year: Number
synopsis: String (índice de texto)
duration: Number
rating: G | PG | PG-13 | R | NC-17
director: ObjectId → Director
genres: [ObjectId → Genre]
availability: [{ store: ObjectId → Store, copies: Number }]
imageUrl: String
```

### Director
```
name: String (requerido, índice de texto)
nationality: String
biography: String
```

### Genre
```
name: String (requerido, único)
```

### Store
```
name: String (requerido)
address: String
phone: String
```

### User
```
email: String (requerido, único)
password: String (hasheado con bcrypt)
role: 'admin'
```

---

## Seed data

Ejecutar `npm run seed` para poblar la BD con:

- **10 películas** (Psicosis, Inception, Barbie, etc.)
- **5 directores** (Hitchcock, Nolan, Gerwig, del Toro, Spike Lee)
- **6 géneros** (Terror, Comedia, Drama, Ciencia Ficción, Suspenso, Acción)
- **3 tiendas** (Centro, Norte, Sur)
- **1 admin** — email: `admin@cineclub.com` / password: `admin123`

---

## Próximos pasos (Fase 5)

1. Crear frontend React con Vite
2. Interfaz pública: galería de películas con filtros + widget de chat flotante
3. Panel admin: login, CRUD de películas/directores/géneros/tiendas
4. Conectar Socket.io desde el frontend para el chat en tiempo real
