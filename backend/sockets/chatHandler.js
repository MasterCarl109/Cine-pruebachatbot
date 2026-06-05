const { isCatalogRelated } = require('../services/intentFilter')
const { generateResponse } = require('../services/ollamaService')
const Movie = require('../models/Movie')
const Director = require('../models/Director')
const Genre = require('../models/Genre')

const OFF_TOPIC_REPLY = 'Solo puedo ayudarte con nuestro catálogo de películas. ¿Buscas algún género o director en particular?'

const SYSTEM_PROMPT = 'Eres el asistente virtual de CineClub. Responde en texto natural, amable y conversacional. NO uses JSON ni listas técnicas. Solo puedes responder usando la información del catálogo que se te proporciona. Si no encuentras suficiente información, indica amablemente que no tienes ese dato. Nunca inventes títulos, directores o disponibilidad.'

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
    'aquel', 'aquella', 'aquello', 'aquellos', 'aquellas'
])

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildAccentRegex(word) {
    const accentMap = {
        'a': '[aáàäâ]', 'e': '[eéèëê]', 'i': '[iíìïî]',
        'o': '[oóòöô]', 'u': '[uúùüû]', 'n': '[nñ]'
    }
    const escaped = escapeRegex(word)
    const pattern = escaped.split('').map(c => accentMap[c.toLowerCase()] || c).join('')
    return new RegExp(pattern, 'i')
}

function extractKeywords(text) {
    const normalized = text.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return normalized
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && !STOP_WORDS.has(word))
}

async function searchCatalog(message) {
    const keywords = extractKeywords(message)

    if (keywords.length === 0) {
        return { movies: [], directors: [] }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const activeFilter = {
        'screenings.date': { $gte: today }
    }

    const regexConditions = keywords.map(kw => ({
        $or: [
            { title: { $regex: buildAccentRegex(kw) } },
            { synopsis: { $regex: buildAccentRegex(kw) } }
        ]
    }))

    const [moviesByText, moviesByGenre, directors] = await Promise.all([
        Movie.find({ $or: regexConditions, ...activeFilter })
            .populate('director', 'name')
            .populate('genres', 'name')
            .populate('screenings.store', 'name')
            .lean(),

        Genre.find({
            $or: keywords.map(kw => ({ name: buildAccentRegex(kw) }))
        }).lean().then(genres => {
            if (genres.length === 0) return []
            return Movie.find({ genres: { $in: genres.map(g => g._id) }, ...activeFilter })
                .populate('director', 'name')
                .populate('genres', 'name')
                .populate('screenings.store', 'name')
                .lean()
        }),

        Director.find({
            $or: keywords.map(kw => ({ name: buildAccentRegex(kw) }))
        }).lean()
    ])

    let moviesByDirector = []
    if (directors.length > 0) {
        moviesByDirector = await Movie.find({ director: { $in: directors.map(d => d._id) }, ...activeFilter })
            .populate('director', 'name')
            .populate('genres', 'name')
            .populate('screenings.store', 'name')
            .lean()
    }

    const movieMap = new Map()
    for (const m of [...moviesByText, ...moviesByGenre, ...moviesByDirector]) {
        const id = String(m._id)
        if (!movieMap.has(id)) movieMap.set(id, m)
    }

    return {
        movies: Array.from(movieMap.values()),
        directors
    }
}

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log(`Usuario conectado: ${socket.id}`)

        socket.on('send_message', async (data) => {
            const { message } = data

            if (!message || message.trim() === '') return

            socket.emit('bot_typing', { typing: true })

            try {
                const catalogRelated = await isCatalogRelated(message)

                if (!catalogRelated) {
                    socket.emit('bot_response', { message: OFF_TOPIC_REPLY })
                    socket.emit('bot_typing', { typing: false })
                    return
                }

                const { movies, directors } = await searchCatalog(message)

                const now = new Date()
                const context = {
                    consulta: message,
                    peliculas_encontradas: movies.map(m => {
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        const activeScreenings = m.screenings
                            ?.filter(s => new Date(s.date) >= today) || []

                        const totalBooked = activeScreenings.reduce((sum, s) =>
                            sum + (s.bookedSeats || 0), 0)

                        return {
                            titulo: m.title,
                            sinopsis: m.synopsis,
                            duracion: m.duration,
                            clasificacion: m.rating,
                            director: m.director?.name || 'Desconocido',
                            generos: m.genres?.map(g => g.name) || [],
                            popularidad: totalBooked + activeScreenings.length,
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

                const reply = await generateResponse(SYSTEM_PROMPT, context, message)
                socket.emit('bot_response', { message: reply })
            } catch (error) {
                console.error('Error en chatHandler:', error.message)
                socket.emit('bot_response', { message: 'Ocurrió un error al procesar tu mensaje. Intenta de nuevo.' })
            } finally {
                socket.emit('bot_typing', { typing: false })
            }
        })

        socket.on('disconnect', () => {
            console.log(`Usuario desconectado: ${socket.id}`)
        })
    })
}
