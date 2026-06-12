# CineClub Backend

Backend del sistema de reservas de CineClub.  
Catálogo de películas, autenticación por sesiones opacas, reservas con tarjeta virtual, y chatbot con Ollama + Socket.io en tiempo real.

---

## Estado del proyecto

| Fase | Estado |
|------|--------|
| **Fundación** (server, modelos, DB, auth opaca, seed) | ✅ |
| **CRUD Admin** (movies, directors, genres, stores, users) con validación | ✅ |
| **Chatbot** (intentFilter local, generateResponse con retry, memoria de conversación) | ✅ |
| **Chat en tiempo real** (Socket.IO, transferencia a manager, quick replies) | ✅ |
| **Reservas** (atómico, pago con tarjeta virtual + PIN, reembolso) | ✅ |
| **Portal cliente** (catálogo, registro, login, mis reservas) | ✅ |
| **Panel staff** (admin:global, manager:su tienda, employee:inventario+reservas) | ✅ |

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
│   ├── ollamaService.js      # generateResponse() con retry automático + validación de respuesta genérica
│   └── intentFilter.js       # isCatalogRelated() 100% local: cinema keywords + blacklist (sin Ollama)
├── sockets/
│   └── chatHandler.js       # Eventos Socket.io: chatbot + chat manager-cliente + memoria de conversación
├── routes/
│   ├── auth.js               # POST /api/auth/login
│   ├── movies.js             # CRUD películas (protegido)
│   ├── directors.js          # CRUD directores (protegido)
│   ├── genres.js             # CRUD géneros (protegido)
│   └── stores.js             # CRUD tiendas (protegido)
├── middleware/
│   ├── auth.js              # Middleware de sesión opaca (cookie httpOnly → MongoDB Session)
│   └── validate.js           # Validación de request body con express-validator
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
| `OLLAMA_MODEL` | Modelo principal de Ollama | `llama3.2:1b` |
| `FALLBACK_MODEL` | Modelo de respaldo (si el principal falla) | `qwen2.5:3b` |
| `ALLOWED_ORIGINS` | Orígenes CORS permitidos (separados por coma) | `http://localhost:5173,http://localhost:5174` |

---

## API disponible

### Públicas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Health check del servicio |
| POST | `/api/auth/login` | Inicio de sesión staff → cookie httpOnly con token opaco |
| POST | `/api/client-auth/login` | Inicio de sesión cliente → cookie httpOnly + socketToken |
| POST | `/api/client-auth/register` | Registro público de cliente (genera tarjeta virtual) |

### Protegidas (requieren cookie de sesión — httpOnly, sameSite: lax)

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
| `send_message` | Cliente → Servidor | Mensaje al chatbot (procesa intención, busca catálogo, genera respuesta con Ollama) |
| `bot_response` | Servidor → Cliente | Respuesta del chatbot |
| `bot_suggestions` | Servidor → Cliente | Sugerencias de respuesta rápida (chips clickeables) |
| `bot_typing` | Servidor → Cliente | Indicador de escritura (`{ typing: true/false }`) |
| `manager_join` | Manager → Servidor | Manager se conecta a sala de atención |
| `manager_accept_chat` | Manager → Servidor | Acepta una solicitud de chat en espera |
| `manager_send_message` | Manager → Servidor | Envía mensaje al cliente |
| `manager_close_chat` | Manager → Servidor | Cierra la conversación |
| `client_send_message` | Cliente → Servidor | Cliente responde al manager |
| `new_chat_request` | Servidor → Managers | Nueva solicitud de chat disponible |
| `chat_accepted` | Servidor → Cliente | Manager aceptó el chat |
| `chat_closed` | Servidor → Cliente | Chat finalizado por el manager |

---

## Modelos de datos

### Movie
```
title: String (requerido)
price: Number
synopsis: String
duration: Number
rating: String
director: ObjectId → Director
genres: [ObjectId → Genre]
screenings: [{ store, room, date, time, totalSeats, bookedSeats }]
offers: [{ store?, description, discountPercent, startDate, endDate, active }]
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
rooms: [{ name, capacity }]
```

### User
```
email: String (requerido, único)
password: String (hasheado con bcrypt)
role: 'admin' | 'manager' | 'employee'
store: ObjectId → Store (opcional, null para admin)
active: Boolean
```

---

## Seed data

Ejecutar `npm run seed` para poblar la BD con:

- **Películas** con `screenings` planos (fecha+hora individuales) en distintas salas/tiendas
- **Directores**, **géneros**, **3 tiendas** (Centro, Norte, Sur) con 5 salas c/u
- **Usuarios staff**: admin, manager (Centro/Sur), employee (Norte)
- **1 cliente** (cliente@cineclub.com / cliente123, saldo ~$99,590)


