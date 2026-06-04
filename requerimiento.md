Documento de Requerimientos – CineClub
Asistente Virtual de Catálogo de Videoclub

1. Visión general del proyecto
CineClub es una cadena de tres videoclubs que ofrece alquiler de películas en formato físico y digital. Se requiere una página web con dos partes:

Una zona pública donde los clientes puedan explorar el catálogo y chatear en tiempo real con un asistente virtual.

Un panel de administración protegido para que el dueño gestione películas, directores, géneros y tiendas.

El asistente virtual (basado en Ollama) solo responderá preguntas relacionadas con el catálogo y la disponibilidad en tiendas. Cualquier consulta ajena será rechazada educadamente.

2. Actores del sistema
Actor	Descripción
Visitante	Cliente que navega el catálogo y usa el chat sin necesidad de registro.
Administrador	Dueño o empleado autorizado. Accede al panel de gestión mediante login.
3. Entidades y relaciones
Se usarán 4 colecciones principales en MongoDB.

3.1. movies (Película)
Campo	Tipo	Descripción
_id	ObjectId	Identificador único.
title	String	Título de la película.
year	Number	Año de estreno.
synopsis	String	Sinopsis breve.
duration	Number	Duración en minutos.
rating	String	Clasificación por edad (G, PG, PG-13, R, etc.).
director	ObjectId (ref Director)	Director de la película.
genres	[ObjectId (ref Genre)]	Lista de géneros.
availability	[ { store: ObjectId, copies: Number } ]	Disponibilidad por tienda.
imageUrl	String	URL de la carátula.
3.2. directors (Director)
Campo	Tipo	Descripción
_id	ObjectId	Identificador único.
name	String	Nombre completo.
nationality	String	Nacionalidad.
biography	String	Biografía breve.
3.3. genres (Género)
Campo	Tipo	Descripción
_id	ObjectId	Identificador único.
name	String	Nombre del género (único).
3.4. stores (Tienda)
Campo	Tipo	Descripción
_id	ObjectId	Identificador único.
name	String	Nombre de la sucursal.
address	String	Dirección física.
phone	String	Teléfono de contacto.
Nota: No existe entidad de usuarios clientes; los visitantes son anónimos. Solo se guarda un usuario administrador en una colección users (con campos email, password hasheado, role: 'admin').

4. Requerimientos funcionales
4.1. Chat en tiempo real (Visitante)
RF01: El sistema mostrará un ícono flotante de chat en la página pública. Al hacer clic se abrirá un widget de conversación.

RF02: La comunicación entre el frontend React y el backend Node se realizará mediante WebSockets (Socket.io).

RF03: Al enviar un mensaje, el backend:

Aplicará un filtro de intención para verificar que la consulta es sobre el catálogo.
Si la intención es válida, buscará en MongoDB las películas, directores, géneros o tiendas que coincidan con la consulta (usando índices de texto).
Construirá un contexto estructurado con los resultados.
Enviará a Ollama un prompt de sistema restrictivo más el contexto y la pregunta del usuario.
Devolverá la respuesta generada al cliente a través del socket.
RF04: Si el filtro detecta una pregunta fuera de tema, el backend responderá inmediatamente con el mensaje fijo:
“Solo puedo ayudarte con nuestro catálogo de películas. ¿Buscas algún género o director en particular?”

4.2. Restricción estricta del dominio
RF05: El filtro de intención constará de dos capas:

Lista negra de palabras clave (deportes, política, clima, música, etc.). Si el mensaje contiene alguna, se rechaza de inmediato.
Clasificación con Ollama: un mini prompt que evalúa si la pregunta pertenece al dominio del videoclub. Responde únicamente catalogo o otro. Si es otro, se envía el mensaje fijo.
RF06: El prompt del sistema enviado a Ollama incluirá instrucciones explícitas:
“Eres el asistente virtual de CineClub. Solo puedes responder usando la información del contexto proporcionado. Si no encuentras suficiente información, indica amablemente que no tienes ese dato en el catálogo. Nunca inventes títulos, directores o disponibilidad.”

4.3. Panel de administración (Administrador)
RF07: El administrador iniciará sesión con email y contraseña (JWT).

RF08: Podrá realizar operaciones CRUD completas sobre:

Películas (movies)

Directores (directors)

Géneros (genres)

Tiendas (stores)

RF09: En la gestión de películas podrá modificar el campo availability para actualizar las copias disponibles en cada tienda.

RF10: La autenticación se verificará en cada petición al panel mediante middleware que compruebe el token JWT y el rol admin.

4.4. Interfaz pública (sin autenticación)
RF11: La página principal mostrará una galería de películas destacadas, con opción de filtrar por género o tienda (filtros locales o consultas al backend).

RF12: El chat estará disponible en todas las páginas públicas como un widget flotante.

5. Requerimientos no funcionales
RNF01: Ollama debe responder en menos de 3 segundos para no entorpecer la conversación.

RNF02: La conexión WebSocket se reconectará automáticamente en caso de interrupción.

RNF03: El sistema será modular: separación clara entre modelos, servicios (Ollama, filtro), sockets y rutas.

RNF04: Las colecciones movies, directors y genres tendrán índices de texto en los campos de búsqueda (título, sinopsis, nombre) para consultas eficientes.

RNF05: El frontend mostrará un indicador visual de “escribiendo…” mientras el backend procesa la respuesta del chatbot.

RNF06: Las contraseñas del administrador se almacenarán hasheadas con bcrypt.

RNF07: La API administrativa usará JWT con expiración de 24 horas.

6. Flujo de conversación típico (ejemplos)
Usuario	Asistente
“Hola, ¿tienen algo de Hitchcock?”	“Sí, tenemos 3 películas de Alfred Hitchcock. ¿Quieres que te las enumere?”
“Dime cuáles”	“Psicosis, Los pájaros y La ventana indiscre. Todas están disponibles en al menos una tienda. ¿Te interesa alguna?”
“¿Hay copias de Matrix en la tienda del centro?”	“Actualmente hay 2 copias de Matrix en la tienda Centro. ¿Quieres saber el horario de esa sucursal?” (si la info de horario no está en BD, pediría disculpas)
“Recomiéndame una comedia para hoy”	“Te recomiendo ‘Supercool’, una comedia de 2007. Tenemos 3 copias entre todas las tiendas.”
“¿Quién ganó la Copa del Rey?”	“Solo puedo ayudarte con nuestro catálogo de películas. ¿Buscas algo en concreto?”
7. Plan de inicio técnico (backend)
Inicializar proyecto Node.js
npm init -y
Instalar: express, mongoose, socket.io, dotenv, cors, jsonwebtoken, bcryptjs.
Dev: nodemon.

Estructura de carpetas

text
backend/
├── server.js
├── .env
├── config/db.js
├── models/ (Movie, Director, Genre, Store, User)
├── services/ (ollamaService, intentFilter)
├── sockets/chatHandler.js
├── routes/ (auth, movies, directors, genres, stores)
├── middleware/auth.js
└── seed.js
Variables de entorno (.env)

PORT, MONGODB_URI, OLLAMA_URL, OLLAMA_MODEL, JWT_SECRET

Modelos con Mongoose, creando índices de texto en Movie.title, Movie.synopsis, Director.name.

Servicios

ollamaService.js: función generateResponse(systemPrompt, context, userMessage) que llama a la API de Ollama.

intentFilter.js: función isCatalogRelated(message) que implementa la doble verificación (lista negra + mini prompt a Ollama).

Socket.io en chatHandler.js: escucha send_message, ejecuta filtro, busca en BD, arma contexto, llama a Ollama, emite respuesta.

Rutas administrativas protegidas con middleware auth.js (verifica JWT y rol admin).

Seed con datos de prueba: 10 películas, 5 directores, 6 géneros, 3 tiendas y un admin.