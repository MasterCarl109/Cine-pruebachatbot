const { isCatalogRelated } = require('../services/intentFilter')
const { generateResponse } = require('../services/ollamaService')
const { extractKeywords, buildAccentRegex, escapeRegex, normalizeText, closestMatch, isConfirming, isRejecting } = require('../services/searchHelper')
const Movie = require('../models/Movie')
const Director = require('../models/Director')
const Genre = require('../models/Genre')
const ChatSession = require('../models/ChatSession')
const Client = require('../models/Client')
const Store = require('../models/Store')

const OFF_TOPIC_REPLY = 'Solo hablo de cine y de nuestro catálogo de CineClub. ¿Buscas alguna película, género o director en particular?'

const SYSTEM_PROMPT = 'Eres el asistente virtual de CineClub, un cine con múltiples sucursales. Responde siempre en español, de forma natural y concisa.\n\nREGLAS ESTRICTAS:\n- Solo puedes usar la información del catálogo que se te proporciona. NUNCA inventes títulos, directores, horarios, fechas, precios o disponibilidad.\n- NO uses JSON ni formatos técnicos. Texto natural solamente.\n- NUNCA hagas chistes, cuentas matemáticas o temas ajenos al cine.\n\nInstrucciones según la consulta:\n- Si pregunta por el catálogo o películas disponibles: responde SOLO con los nombres y precios. NO incluyas horarios, funciones, sinopsis ni ofertas a menos que las pida específicamente.\n- Si pregunta por una película en específico (ej: "cuéntame de X", "dame información de X", "hablame de X", "detalles de X", "informacion sobre X"): da todos los detalles: sinopsis, géneros, funciones disponibles con horarios y asientos libres.\n- Si pregunta por ofertas o promociones: busca el campo "Ofertas:" en los datos del catálogo y enlistalas con sus descuentos y vigencia. Si no hay ofertas activas, indícalo claramente. NO incluyas películas que no tengan ofertas.\n- Si pregunta cómo reservar: explica el paso a paso (iniciar sesión, ir al catálogo, elegir función y asientos, pagar con tarjeta virtual + PIN).'

const TRANSFER_KEYWORDS = ['gerente', 'manager', 'humano', 'asesor', 'persona real', 'hablar con', 'atencion', 'ayuda humana', 'representante', 'supervisor', 'transferir', 'transferencia', 'me comuniques', 'me conectes', 'me pongas', 'operador']

// Rastrea sockets esperando selección de sucursal antes de transferir a manager
const pendingStoreSelection = new Map()

// Rastrea sockets esperando selección de sucursal para consultar catálogo
const pendingCatalogStore = new Map()

// Rastrea sockets esperando confirmación de título fuzzy
const pendingFuzzyConfirm = new Map()

// Memoria de conversación para seguimiento ("cuéntame más de esa")
const conversationMemory = new Map()
const MEMORY_TTL = 5 * 60 * 1000 // 5 minutos

const FOLLOW_UP_PATTERNS = [
    'cuentame mas', 'dime mas', 'hablame mas',
    'cuentame más', 'dime más', 'hablame más',
    'y esa', 'y ese', 'y esta', 'y este',
    'mas sobre', 'mas de', 'más sobre', 'más de',
    'detalles', 'mas detalles', 'más detalles',
    'informacion de esa', 'información de esa',
    'quiero saber mas', 'quiero saber más',
    'ampliar', 'profundiza', 'sigue contando',
    'sigueme contando', 'sigueme hablando',
    'hablame de esa', 'hablame de ese'
]

function isFollowUp(message) {
    const normalized = normalizeText(message)
    return FOLLOW_UP_PATTERNS.some(pattern => normalized.includes(pattern))
}

const STOP_WORDS = new Set([
    'hola', 'buenos', 'buenas', 'dias', 'tardes', 'noches',
    'quiero', 'quieres', 'quisiera', 'gustaria', 'gusta',
    'puedes', 'puedo', 'podrias', 'podria', 'poder',
    'favor', 'gracias',
    'que', 'cual', 'cuales', 'como', 'donde', 'cuando', 'quien',
    'hay', 'tienen', 'tiene', 'tengo', 'busco', 'busca', 'necesito', 'necesita',
    'dame', 'muestrame', 'muestra', 'mira',
    'pelicula', 'peliculas', 'director', 'directores', 'genero', 'generos',
    'catalogo', 'recomiendas', 'recomiendame', 'recomendar', 'recomienda',
    'de', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas',
    'del', 'al', 'por', 'para', 'con', 'sin', 'sobre', 'entre',
    'y', 'e', 'o', 'u', 'a', 'ante', 'bajo', 'cabe', 'contra',
    'desde', 'durante', 'en', 'hacia', 'hasta', 'mediante',
    'segun', 'tras', 'via', 'lo', 'le', 'les', 'te', 'se', 'me',
    'es', 'son', 'era', 'ser', 'sido', 'estado',
    'no', 'si', 'tu', 'mi', 'su', 'sus', 'nos', 'os',
    'mas', 'menos', 'muy', 'mucho', 'poco', 'bien', 'mal',
    'algo', 'nada', 'todo', 'todos', 'siempre', 'nunca',
    'tipo', 'tipos', 'tener', 'ver', 'vez', 'ves',
    'informacion', 'nombre', 'listado', 'lista',
    'disponible', 'disponibles', 'disponibilidad',
    'cualquier', 'cualquiera', 'cuanto', 'cuanta', 'cuantos', 'cuantas',
    'esta', 'este', 'esto', 'estos', 'estas',
    'esa', 'ese', 'eso', 'esas', 'esos',
    'aquel', 'aquella', 'aquello', 'aquellos', 'aquellas',
    'oferta', 'ofertas', 'promocion', 'promociones',
    'precio', 'precios', 'descuento', 'descuentos',
    'costo', 'costos', 'tarifa', 'tarifas',
    'cartelera', 'estreno', 'estrenos', 'estrenar',
    'boleto', 'boletos', 'entrada', 'entradas',
    'funcion', 'funciones', 'horario', 'horarios'
])

function extractKeywordsLocal(text) {
    return extractKeywords(text, STOP_WORDS)
}

function hasTransferIntent(text) {
    const lower = normalizeText(text)
    return TRANSFER_KEYWORDS.some(kw => lower.includes(kw))
}

function populates() {
    return [
        'director',
        'genres',
        'screenings.store',
        'offers.store'
    ].map(f => ({ path: f, select: 'name' }))
}

async function searchCatalog(message, store = null) {
    const keywords = extractKeywordsLocal(message)

    if (keywords.length === 0) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const filter = { 'screenings.date': { $gte: today } }
        if (store) filter['screenings.store'] = store._id
        const allMovies = await Movie.find(filter)
            .populate(populates())
            .lean()
        return { movies: allMovies, directors: [] }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const activeFilter = {
        'screenings.date': { $gte: today }
    }

    // Si se proporcionó una tienda, filtrar solo sus funciones
    if (store) {
        activeFilter['screenings.store'] = store._id
    }

    const regexConditions = keywords.map(kw => ({
        $or: [
            { title: { $regex: buildAccentRegex(kw) } },
            { synopsis: { $regex: buildAccentRegex(kw) } }
        ]
    }))

    const [moviesByText, moviesByGenre, directors] = await Promise.all([
        Movie.find({ $or: regexConditions, ...activeFilter })
            .populate(populates())
            .lean(),

        Genre.find({
            $or: keywords.map(kw => ({ name: buildAccentRegex(kw) }))
        }).lean().then(genres => {
            if (genres.length === 0) return []
            return Movie.find({ genres: { $in: genres.map(g => g._id) }, ...activeFilter })
                .populate(populates())
                .lean()
        }),

        Director.find({
            $or: keywords.map(kw => ({ name: buildAccentRegex(kw) }))
        }).lean()
    ])

    let moviesByDirector = []
    if (directors.length > 0) {
        moviesByDirector = await Movie.find({ director: { $in: directors.map(d => d._id) }, ...activeFilter })
            .populate(populates())
            .lean()
    }

    const movieMap = new Map()
    for (const m of [...moviesByText, ...moviesByGenre, ...moviesByDirector]) {
        const id = String(m._id)
        if (!movieMap.has(id)) movieMap.set(id, m)
    }

    // Fallback: si keywords no matchearon nada, devolver catálogo activo completo
    if (movieMap.size === 0) {
        const fallbackFilter = { 'screenings.date': { $gte: today } }
        if (store) fallbackFilter['screenings.store'] = store._id
        const fallbackMovies = await Movie.find(fallbackFilter)
            .populate(populates())
            .lean()
        return { movies: fallbackMovies, directors: [] }
    }

    return {
        movies: Array.from(movieMap.values()),
        directors
    }
}

function isManager(socket) {
    return socket.user && socket.user.type === 'staff' && ['admin', 'manager'].includes(socket.user.role)
}

function getClientId(socket, data) {
    if (socket.user && socket.user.type === 'client') {
        return socket.user.id
    }
    return null
}

let storesCache = null
let storesCacheTime = 0
const STORES_CACHE_TTL = 30000

async function getStores() {
    if (storesCache && Date.now() - storesCacheTime < STORES_CACHE_TTL) return storesCache
    storesCache = await Store.find({}).lean()
    storesCacheTime = Date.now()
    return storesCache
}

async function detectStore(message) {
    const normalized = normalizeText(message)
    const stores = await getStores()
    for (const store of stores) {
        const name = normalizeText(store.name)
        const escaped = escapeRegex(name)
        const pattern = new RegExp(
            `(sucursal|tienda|cine)\\s+(de\\s+)?(la\\s+)?(del\\s+)?${escaped}` +
            `|\\b${escaped}\\b`, 'i'
        )
        if (pattern.test(normalized)) return store
    }
    return null
}

function buildCatalogContext(message, movies, directors, matchedStore = null) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const now = new Date()

    return {
        consulta: message,
        tienda_mencionada: matchedStore?.name || null,
        peliculas_encontradas: movies.map(m => {
            const activeScreenings = m.screenings
                ?.filter(s => new Date(s.date) >= today) || []

            const totalBooked = activeScreenings.reduce((sum, s) =>
                sum + (s.bookedSeats || 0), 0)

            const activeOffers = m.offers
                ?.filter(o => o.active && new Date(o.startDate) <= now && new Date(o.endDate) >= now)
                .filter(o => !matchedStore || !o.store || String(o.store._id || o.store) === String(matchedStore._id)) || []

            const proximaFuncion = activeScreenings.length > 0
                ? new Date(activeScreenings.reduce((min, s) => {
                    const d = new Date(s.date).getTime()
                    return d < min ? d : min
                }, Infinity)).toLocaleDateString('es-MX')
                : null

            return {
                titulo: m.title,
                sinopsis: m.synopsis,
                duracion: m.duration,
                clasificacion: m.rating,
                director: m.director?.name || 'Desconocido',
                generos: m.genres?.map(g => g.name) || [],
                precio: m.price,
                proximaFuncion,
                popularidad: totalBooked + activeScreenings.length,
                ofertas: activeOffers.map(o => ({
                    descripcion: o.description,
                    descuento: `${o.discountPercent}%`,
                    tienda: o.store?.name || 'Todas las tiendas',
                    vigencia: `${new Date(o.startDate).toLocaleDateString('es-MX')} - ${new Date(o.endDate).toLocaleDateString('es-MX')}`
                })),
                disponibilidad: activeScreenings.map(s => ({
                    tienda: s.store?.name || 'Desconocida',
                    fecha: new Date(s.date).toLocaleDateString('es-MX'),
                    hora: s.time,
                    disponibles: (s.totalSeats || 10) - (s.bookedSeats || 0),
                    total: s.totalSeats || 10
                })) || []
            }
        }),
        directores_encontrados: directors.map(d => ({
            nombre: d.name,
            nacionalidad: d.nationality,
            biografía: d.biography
        }))
    }
}

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log(`Usuario conectado: ${socket.id}${socket.user ? ` (${socket.user.role})` : ' (anónimo)'}`)

        /* ---- BOT CHAT ---- */
        socket.on('send_message', async (data) => {
            const { message } = data

            if (!message || message.trim() === '') return

            socket.emit('bot_typing', { typing: true })

            try {
                /* ---- Pending store selection? ---- */
                if (pendingStoreSelection.has(socket.id)) {
                    const store = await detectStore(message)
                    if (store) {
                        const savedClientId = pendingStoreSelection.get(socket.id)
                        pendingStoreSelection.delete(socket.id)
                        const clientId = savedClientId || getClientId(socket, data)
                        const clientInfo = await Client.findById(clientId).lean()
                        if (!clientInfo) {
                            socket.emit('bot_response', { message: 'No se pudo encontrar tu cuenta. Intenta de nuevo.' })
                            socket.emit('bot_typing', { typing: false })
                            return
                        }

                        const session = await ChatSession.create({
                            client: clientId,
                            store: store._id,
                            status: 'waiting',
                            messages: [{ from: 'system', text: `${clientInfo.name} solicitó hablar con un gerente de ${store.name}.` }]
                        })

                        socket.join(`client:${clientId}`)
                        socket.emit('chat_transfer_offered', { sessionId: session._id })
                        socket.emit('bot_response', { message: `He solicitado que un gerente de ${store.name} te atienda. Por favor espera mientras alguien se conecta contigo.` })

                        io.to('managers').emit('new_chat_request', {
                            sessionId: session._id,
                            clientName: clientInfo.name,
                            clientEmail: clientInfo.email,
                            store: store._id,
                            storeName: store.name,
                            createdAt: session.createdAt
                        })

                        socket.emit('bot_typing', { typing: false })
                    } else {
                        const stores = await getStores()
                        const names = stores.map(s => s.name).join(', ')
                        socket.emit('bot_response', { message: `No reconozco esa sucursal. Por favor elige una de las siguientes: ${names}` })
                        socket.emit('bot_suggestions', { suggestions: stores.map(s => s.name) })
                        socket.emit('bot_typing', { typing: false })
                    }
                    return
                }

                /* ---- Pending catalog store selection? ---- */
                if (pendingCatalogStore.has(socket.id)) {
                    const { originalMessage } = pendingCatalogStore.get(socket.id)
                    const store = await detectStore(message)
                    const skipWords = ['cualquiera', 'no importa', 'cualquier', 'da igual', 'no se', 'no sé']
                    const isSkip = skipWords.some(w => message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(w))
                    if (store || isSkip) {
                        pendingCatalogStore.delete(socket.id)
                        const { movies, directors } = await searchCatalog(originalMessage, store)
                        conversationMemory.set(socket.id, { lastMovies: movies, lastStore: store, lastMessage: originalMessage, timestamp: Date.now() })
                        const context = buildCatalogContext(originalMessage, movies, directors, store)
                        if (movies.length === 0) {
                            socket.emit('bot_response', { message: 'No encontré películas en esa sucursal. Intenta con otra búsqueda.' })
                            socket.emit('bot_typing', { typing: false })
                            return
                        }
                        const reply = await generateResponse(SYSTEM_PROMPT, context, originalMessage)
                        socket.emit('bot_response', { message: reply })
                        socket.emit('bot_suggestions', { suggestions: ['Más información', 'Cómo reservar', 'Ofertas'] })
                    } else {
                        const stores = await getStores()
                        const names = stores.map(s => s.name).join(', ')
                        socket.emit('bot_response', { message: `Por favor elige una de nuestras sucursales: ${names}. O escribe "cualquiera" para ver todas.` })
                        socket.emit('bot_suggestions', { suggestions: stores.map(s => s.name).concat(['Cualquiera']) })
                    }
                    socket.emit('bot_typing', { typing: false })
                    return
                }

                /* ---- Pending fuzzy confirm? ---- */
                if (pendingFuzzyConfirm.has(socket.id)) {
                    const { title, store } = pendingFuzzyConfirm.get(socket.id)
                    if (isConfirming(message, title)) {
                        pendingFuzzyConfirm.delete(socket.id)
                        const { movies } = await searchCatalog(title, store)
                        if (movies.length > 0) {
                            conversationMemory.set(socket.id, { lastMovies: movies, lastStore: store, lastMessage: title, timestamp: Date.now() })
                            const context = buildCatalogContext(title, movies, [], store)
                            const reply = await generateResponse(SYSTEM_PROMPT, context, `informacion detallada de ${title}`)
                            socket.emit('bot_response', { message: reply })
                            socket.emit('bot_suggestions', { suggestions: ['Más información', 'Cómo reservar', 'Ofertas'] })
                        } else {
                            socket.emit('bot_response', { message: `No encontré información de "${title}". Intenta con otra búsqueda.` })
                        }
                    } else if (isRejecting(message)) {
                        pendingFuzzyConfirm.delete(socket.id)
                        socket.emit('bot_response', { message: 'Entendido. Dime de qué película te gustaría información.' })
                        socket.emit('bot_suggestions', { suggestions: ['Ver catálogo completo', 'Películas en cartelera', 'Ofertas disponibles'] })
                    } else {
                        socket.emit('bot_response', { message: '¿Esa era la película que buscabas?' })
                        const pending = pendingFuzzyConfirm.get(socket.id)
                        socket.emit('bot_suggestions', { suggestions: [`Sí, ${pending.title}`, 'No, otra'] })
                    }
                    socket.emit('bot_typing', { typing: false })
                    return
                }

                /* ---- Transfer intent? ---- */
                if (hasTransferIntent(message)) {
                    const clientId = getClientId(socket, data)
                    if (!clientId) {
                        socket.emit('bot_response', { message: 'Para hablar con un gerente, primero debes iniciar sesión en tu cuenta. ¿Te gustaría hacerlo?' })
                        socket.emit('bot_typing', { typing: false })
                        return
                    }

                    const clientInfo = await Client.findById(clientId).lean()
                    if (!clientInfo) {
                        socket.emit('bot_response', { message: 'Para hablar con un gerente, primero debes iniciar sesión en tu cuenta. ¿Te gustaría hacerlo?' })
                        socket.emit('bot_typing', { typing: false })
                        return
                    }

                    const existing = await ChatSession.findOne({ client: clientId, status: { $in: ['waiting', 'active'] } }).lean()
                    if (existing) {
                        socket.emit('bot_response', { message: 'Ya tienes una solicitud de atención en curso. Un gerente te atenderá en breve.' })
                        socket.emit('bot_typing', { typing: false })
                        return
                    }

                    // Intentar detectar la tienda directamente en el mensaje
                    const store = await detectStore(message)
                    if (store) {
                        const session = await ChatSession.create({
                            client: clientId,
                            store: store._id,
                            status: 'waiting',
                            messages: [{ from: 'system', text: `${clientInfo.name} solicitó hablar con un gerente de ${store.name}.` }]
                        })

                        socket.join(`client:${clientId}`)
                        socket.emit('chat_transfer_offered', { sessionId: session._id })
                        socket.emit('bot_response', { message: `He solicitado que un gerente de ${store.name} te atienda. Por favor espera mientras alguien se conecta contigo.` })

                        io.to('managers').emit('new_chat_request', {
                            sessionId: session._id,
                            clientName: clientInfo.name,
                            clientEmail: clientInfo.email,
                            store: store._id,
                            storeName: store.name,
                            createdAt: session.createdAt
                        })

                        socket.emit('bot_typing', { typing: false })
                        return
                    }

                    // No se detectó tienda, preguntar al usuario
                    pendingStoreSelection.set(socket.id, clientId)
                    const stores = await getStores()
                    const names = stores.map(s => s.name).join(', ')
                    socket.emit('bot_response', { message: `Claro, ¿de qué sucursal deseas atención? Tenemos: ${names}` })
                    socket.emit('bot_suggestions', { suggestions: stores.map(s => s.name) })
                    socket.emit('bot_typing', { typing: false })
                    return
                }

                /* ---- Follow-up? (usa memoria de conversación) ---- */
                if (isFollowUp(message)) {
                    const memory = conversationMemory.get(socket.id)
                    if (memory && Date.now() - memory.timestamp < MEMORY_TTL && memory.lastMovies.length > 0) {
                        const enhancedMsg = `${message} (refiriéndose a: ${memory.lastMovies.map(m => m.title).join(', ')})`
                        const context = buildCatalogContext(enhancedMsg, memory.lastMovies, [], memory.lastStore)
                        const reply = await generateResponse(SYSTEM_PROMPT, context, enhancedMsg)
                        socket.emit('bot_response', { message: reply })
                        socket.emit('bot_typing', { typing: false })
                        return
                    }
                }

                const catalogRelated = isCatalogRelated(message)

                if (!catalogRelated) {
                    socket.emit('bot_response', { message: OFF_TOPIC_REPLY })
                    socket.emit('bot_suggestions', { suggestions: ['Ver catálogo completo', 'Películas en cartelera', 'Ofertas disponibles'] })
                    socket.emit('bot_typing', { typing: false })
                    return
                }

                // Detectar tienda si se menciona (sin forzar aún)
                const detectedStore = await detectStore(message)
                const memory = conversationMemory.get(socket.id)

                // ¿Pregunta por una película específica de la conversación anterior?
                if (memory && Date.now() - memory.timestamp < MEMORY_TTL && memory.lastMovies.length > 0) {
                    const normalizedMsg = normalizeText(message)
                    let matchedMovie = memory.lastMovies.find(m => {
                        const normalizedTitle = normalizeText(m.title)
                        return normalizedMsg.includes(normalizedTitle)
                    })

                    if (matchedMovie) {
                        const storeFilter = detectedStore || memory.lastStore
                        const { movies } = await searchCatalog(matchedMovie.title, storeFilter)
                        if (movies.length > 0) {
                            conversationMemory.set(socket.id, { lastMovies: movies, lastStore: storeFilter, lastMessage: message, timestamp: Date.now() })
                            const context = buildCatalogContext(message, movies, [], storeFilter)
                            const reply = await generateResponse(SYSTEM_PROMPT, context, `informacion detallada de ${matchedMovie.title}`)
                            socket.emit('bot_response', { message: reply })
                            socket.emit('bot_typing', { typing: false })
                            return
                        }
                    }

                    // Fuzzy match: título con >=80% similitud
                    const titles = memory.lastMovies.map(m => m.title)
                    const fuzzyTitle = closestMatch(message, titles, 0.8)
                    if (fuzzyTitle) {
                        pendingFuzzyConfirm.set(socket.id, { title: fuzzyTitle, store: detectedStore || memory.lastStore })
                        socket.emit('bot_response', { message: `¿Quisiste decir "${fuzzyTitle}"?` })
                        socket.emit('bot_suggestions', { suggestions: [`Sí, ${fuzzyTitle}`, 'No, otra'] })
                        socket.emit('bot_typing', { typing: false })
                        return
                    }
                }

                // Si no se mencionó tienda, preguntar primero antes de buscar
                if (!detectedStore) {
                    pendingCatalogStore.set(socket.id, { originalMessage: message })
                    const stores = await getStores()
                    const names = stores.map(s => s.name).join(', ')
                    socket.emit('bot_response', { message: `¿De qué sucursal te gustaría información? Tenemos: ${names}. O dime "cualquiera" para ver todas.` })
                    socket.emit('bot_suggestions', { suggestions: stores.map(s => s.name).concat(['Cualquiera']) })
                    socket.emit('bot_typing', { typing: false })
                    return
                }

                const { movies, directors } = await searchCatalog(message, detectedStore)
                conversationMemory.set(socket.id, { lastMovies: movies, lastStore: detectedStore, lastMessage: message, timestamp: Date.now() })
                const context = buildCatalogContext(message, movies, directors, detectedStore)

                if (movies.length === 0) {
                    socket.emit('bot_response', { message: 'No encontré películas en esa sucursal. Intenta con otra búsqueda.' })
                    socket.emit('bot_typing', { typing: false })
                    return
                }

                const reply = await generateResponse(SYSTEM_PROMPT, context, message)
                socket.emit('bot_response', { message: reply })
                socket.emit('bot_suggestions', { suggestions: ['Más información', 'Cómo reservar', 'Ofertas'] })
            } catch (error) {
                console.error('Error en chatHandler:', error.message, error.stack?.split('\n').slice(0, 4).join('\n'), '| Message:', message)
                socket.emit('bot_response', { message: 'Ocurrió un error al procesar tu mensaje. Intenta de nuevo.' })
            } finally {
                socket.emit('bot_typing', { typing: false })
            }
        })

        /* ---- MANAGER JOIN ---- */
        socket.on('manager_join', async () => {
            if (!isManager(socket)) {
                socket.emit('chat_error', { message: 'No autorizado. Debes ser gerente o administrador.' })
                return
            }

            socket.join('managers')
            socket.data.storeId = socket.user.store
            console.log(`Manager conectado: ${socket.user.name} (${socket.user.role})`)
        })

        /* ---- MANAGER ACCEPT CHAT ---- */
        socket.on('manager_accept_chat', async (data) => {
            if (!isManager(socket)) {
                socket.emit('chat_error', { message: 'No autorizado.' })
                return
            }

            const { sessionId } = data
            if (!sessionId) return

            try {
                const session = await ChatSession.findOneAndUpdate(
                    { _id: sessionId, status: 'waiting' },
                    { status: 'active', manager: socket.user.id },
                    { new: true }
                ).populate('client', 'name email').lean()

                if (!session) {
                    socket.emit('chat_error', { message: 'La sesión ya fue aceptada por otro agente.' })
                    return
                }

                socket.emit('chat_connected', {
                    sessionId: session._id,
                    clientName: session.client.name,
                    messages: session.messages || []
                })

                io.to(`client:${session.client._id}`).emit('chat_accepted', {
                    sessionId: session._id,
                    managerName: socket.user.name || 'Gerente'
                })

                io.to('managers').emit('chat_request_updated', { sessionId, status: 'active' })
            } catch (err) {
                console.error('Error accepting chat:', err.message)
            }
        })

        /* ---- MANAGER SEND MESSAGE ---- */
        socket.on('manager_send_message', async (data) => {
            if (!isManager(socket)) {
                socket.emit('chat_error', { message: 'No autorizado.' })
                return
            }

            const { sessionId, text } = data
            if (!sessionId || !text?.trim()) return

            try {
                const session = await ChatSession.findOne({ _id: sessionId, manager: socket.user.id })
                if (!session) {
                    socket.emit('chat_error', { message: 'No tienes una sesión activa con este cliente.' })
                    return
                }

                session.messages.push({ from: 'manager', text })
                await session.save()

                io.to(`client:${session.client}`).emit('manager_message', { sessionId, text })
                socket.emit('chat_message_sent', { sessionId, text })
            } catch (err) {
                console.error('Error sending manager message:', err.message)
            }
        })

        /* ---- CLIENT SEND MESSAGE (manager chat) ---- */
        socket.on('client_send_message', async (data) => {
            const clientId = socket.user?.type === 'client' ? socket.user.id : null
            if (!clientId) {
                socket.emit('chat_error', { message: 'Debes iniciar sesión para enviar mensajes.' })
                return
            }

            const { sessionId, text } = data
            if (!sessionId || !text?.trim()) return

            try {
                const session = await ChatSession.findOne({ _id: sessionId, client: clientId, status: { $ne: 'closed' } })
                if (!session) {
                    socket.emit('chat_error', { message: 'No tienes una sesión activa.' })
                    return
                }

                session.messages.push({ from: 'client', text })
                await session.save()

                io.to('managers').emit('client_message', { sessionId, text })
            } catch (err) {
                console.error('Error in client_send_message:', err.message)
            }
        })

        /* ---- MANAGER CLOSE CHAT ---- */
        socket.on('manager_close_chat', async (data) => {
            if (!isManager(socket)) {
                socket.emit('chat_error', { message: 'No autorizado.' })
                return
            }

            const { sessionId } = data
            if (!sessionId) return

            try {
                const session = await ChatSession.findOneAndUpdate(
                    { _id: sessionId, manager: socket.user.id, status: 'active' },
                    { status: 'closed' },
                    { new: true }
                ).populate('client', 'name email').lean()

                if (!session) return

                io.to(`client:${session.client._id}`).emit('chat_closed', { sessionId, reason: 'El gerente ha cerrado la conversación.' })
                io.to('managers').emit('chat_request_updated', { sessionId, status: 'closed' })
            } catch (err) {
                console.error('Error closing chat:', err.message)
            }
        })

        socket.on('disconnect', () => {
            pendingStoreSelection.delete(socket.id)
            pendingCatalogStore.delete(socket.id)
            conversationMemory.delete(socket.id)
            console.log(`Usuario desconectado: ${socket.id}`)
        })
    })
}
