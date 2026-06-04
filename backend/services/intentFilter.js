const { classifyIntent } = require('./ollamaService')

const MATH_EXPR = /\d+\s*[\+\-\*\/]\s*\d+/

const BLACKLIST = [
    'deporte', 'fútbol', 'béisbol', 'baloncesto', 'tenis', 'f1', 'nfl', 'nba',
    'política', 'gobierno', 'presidente', 'elección', 'partido', 'votar',
    'clima', 'lluvia', 'temperatura', 'tormenta',
    'música', 'canción', 'álbum', 'banda', 'concierto', 'spotify',
    'cocina', 'receta', 'comida', 'restaurante',
    'tecnología', 'programación', 'código', 'software', 'hardware', 'javascript', 'python',
    'salud', 'enfermedad', 'medicina', 'hospital', 'doctor',
    'economía', 'dinero', 'bolsa', 'inversión', 'criptomoneda',
    'noticia',
    'historia', 'guerra', 'país',
    'viaje', 'hotel', 'vuelo', 'turismo',
    'videojuego', 'playstation', 'xbox', 'nintendo',
    'matemática', 'calcular', 'suma', 'resta', 'multiplicación', 'división', 'ecuación', 'fórmula',
    'cuánto es', 'cuanto es'
]

function hasBlacklistedWords(message) {
    const lower = message.toLowerCase()
    if (MATH_EXPR.test(lower)) return true
    return BLACKLIST.some(word => lower.includes(word))
}

async function isCatalogRelated(message) {
    // Primera capa: lista negra de palabras clave
    if (hasBlacklistedWords(message)) {
        return false
    }

    // Segunda capa: clasificación con Ollama
    try {
        const intent = await classifyIntent(message)
        return intent === 'catalogo'
    } catch (error) {
        console.error('Error en clasificación Ollama:', error.message)
        return true
    }
}

module.exports = { isCatalogRelated }
