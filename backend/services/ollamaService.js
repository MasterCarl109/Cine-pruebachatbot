const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b'
const FALLBACK_MODEL = process.env.FALLBACK_MODEL || 'llama3.2:1b'
const TIMEOUT_MS = 15000
const FALLBACK_TIMEOUT_MS = 8000

const GENERIC_PHRASES = [
    'no tengo información', 'no tengo datos', 'no tengo suficiente',
    'no puedo', 'no puedo proporcionar', 'lo siento',
    'no se encuentra', 'no se encontró', 'no se ha encontrado',
    'no está disponible', 'no está en mi base', 'no está en mi conocimiento',
    'no sé', 'no lo sé', 'no lo se',
    'no dispongo', 'no cuento con',
    'no hay información', 'no hay datos',
    'no encuentro', 'no encontré', 'no encontre',
    'no aparecen', 'no aparece'
]

async function fetchWithTimeout(url, options, timeoutMs = TIMEOUT_MS) {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeoutMs)
    try {
        const response = await fetch(url, { ...options, signal: controller.signal })
        return response
    } finally {
        clearTimeout(id)
    }
}

async function callOllama(prompt, model, timeoutMs) {
    const response = await fetchWithTimeout(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt, stream: false, options: { temperature: 0.3 } })
    }, timeoutMs)

    if (!response.ok) {
        const body = await response.text().catch(() => '')
        throw new Error(`Ollama error (${model}): ${response.status} ${response.statusText} | ${body}`)
    }

    const data = await response.json()
    return cleanResponse(data.response)
}

function hasGenericResponse(text, context) {
    const lower = text.toLowerCase()
    if (context?.peliculas_encontradas?.length) {
        if (text.length < 60) return true
        const mentionsMovie = context.peliculas_encontradas.some(m =>
            lower.includes(m.titulo.toLowerCase())
        )
        if (mentionsMovie) return false
    }
    return GENERIC_PHRASES.some(p => lower.includes(p))
}

function buildStructuredFallback(context, userMessage) {
    const parts = []
    const msg = (userMessage || context?.consulta || '').toLowerCase()
    const isOfferQuery = /oferta|promocion|descuento/.test(msg)
    const isReserveQuery = /reservar|reserva|comprar|boleto|pagar|tarjeta/.test(msg)

    if (isOfferQuery && context.peliculas_encontradas?.length) {
        const offers = []
        context.peliculas_encontradas.forEach(m => {
            if (m.ofertas?.length) {
                offers.push(`- "${m.titulo}": ${m.ofertas.map(o =>
                    `${o.descripcion} (${o.descuento} de descuento en ${o.tienda}, vigente del ${o.vigencia})`
                ).join(' | ')}`)
            }
        })
        if (offers.length) {
            parts.push('Ofertas disponibles:')
            parts.push(...offers)
        } else {
            parts.push('No hay ofertas activas en este momento.')
        }
        return parts.join('\n')
    }

    if (isReserveQuery) {
        parts.push('Para reservar: inicia sesion en tu cuenta, ve al catalogo, elige la funcion y los asientos, y paga con tu tarjeta virtual + PIN de 6 digitos.')
        return parts.join('\n')
    }

    if (context.peliculas_encontradas?.length) {
        parts.push('Películas disponibles:')
        context.peliculas_encontradas.forEach(m => {
            let line = `- ${m.titulo} — $${m.precio}`
            if (m.generos?.length) line += ` (${m.generos.join(', ')})`
            parts.push(line)
        })
        parts.push('')
        parts.push('¿De cuál película quieres saber más y de qué sucursal?')
    }

    if (context.directores_encontrados?.length) {
        if (parts.length) parts.push('')
        parts.push('Directores:')
        context.directores_encontrados.forEach(d => {
            parts.push(`- ${d.nombre} (${d.nacionalidad || 'nacionalidad no disponible'})`)
        })
    }

    if (parts.length === 0) {
        parts.push('No se encontro informacion en el catalogo.')
    }

    return parts.join('\n')
}

async function generateResponse(systemPrompt, context, userMessage) {
    const contextText = buildContextText(context)
    const prompt = `${systemPrompt}\n\nInformación del catálogo:\n${contextText}\n\nPregunta del usuario: ${userMessage}\n\nRespuesta (texto natural, sin JSON):`

    let response
    try {
        response = await callOllama(prompt, OLLAMA_MODEL, TIMEOUT_MS)
    } catch (primaryError) {
        console.error(`Error con modelo primario ${OLLAMA_MODEL}:`, primaryError.message)
        console.log(`Reintentando con modelo fallback ${FALLBACK_MODEL}...`)
        try {
            response = await callOllama(prompt, FALLBACK_MODEL, FALLBACK_TIMEOUT_MS)
        } catch (fallbackError) {
            if (context.peliculas_encontradas?.length) {
                return buildStructuredFallback(context, userMessage)
            }
            throw new Error(`Ambos modelos fallaron. Primario: ${primaryError.message}. Fallback: ${fallbackError.message}`)
        }
    }

    if (hasGenericResponse(response, context) && context.peliculas_encontradas?.length) {
        response = buildStructuredFallback(context, userMessage)
    }

    return response
}

function buildContextText(context) {
    const parts = []
    if (context.peliculas_encontradas?.length) {
        const sorted = [...context.peliculas_encontradas].sort((a, b) => b.popularidad - a.popularidad)
        parts.push('Películas disponibles en el catálogo:')
        sorted.forEach(m => {
            let line = `- "${m.titulo}" - ${m.sinopsis}. Director: ${m.director}. Géneros: ${m.generos?.join(', ') || 'N/A'}. Precio: $${m.precio}.`
            if (m.proximaFuncion) {
                line += ` Próxima función: ${m.proximaFuncion}.`
            }
            line += ` Popularidad: ${m.popularidad}.`
            if (m.ofertas?.length) {
                line += ` Ofertas: ${m.ofertas.map(o => `${o.descripcion} (${o.descuento} de descuento en ${o.tienda}, vigente del ${o.vigencia})`).join(', ')}.`
            }
            if (m.disponibilidad?.length) {
                line += ` Disponible en: ${m.disponibilidad.map(d =>
                    `${d.tienda} - ${d.fecha} a las ${d.hora} (${d.disponibles} asientos libres de ${d.total})`
                ).join('; ')}.`
            }
            parts.push(line)
        })
    }
    if (context.directores_encontrados?.length) {
        parts.push('Directores encontrados:')
        context.directores_encontrados.forEach(d => {
            parts.push(`- ${d.nombre} (${d.nacionalidad || 'nacionalidad no disponible'})`)
        })
    }
    return parts.join('\n') || 'No se encontró información relevante en el catálogo.'
}

function cleanResponse(text) {
    // Si la respuesta comienza con JSON, extraer solo el texto
    const jsonMatch = text.match(/"respuesta"\s*:\s*"([^"]+)"/)
    if (jsonMatch) return jsonMatch[1]

    // Eliminar bloques JSON completos si aparecen
    let clean = text.replace(/\{[\s\S]*?\}/g, '').trim()
    // Eliminar líneas que parezcan JSON key:value
    clean = clean.replace(/"[^"]+"\s*:\s*"[^"]*"/g, '').trim()
    // Eliminar comillas sobrantes
    clean = clean.replace(/^["']|["']$/g, '').trim()

    return clean || text
}

module.exports = { generateResponse }
