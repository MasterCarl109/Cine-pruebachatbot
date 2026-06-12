const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b'
const TIMEOUT_MS = 15000
const CLASSIFY_MODEL = process.env.CLASSIFY_MODEL || 'llama3.2:1b'
const CLASSIFY_TIMEOUT_MS = 5000

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

async function generateResponse(systemPrompt, context, userMessage) {
    const contextText = buildContextText(context)
    const prompt = `${systemPrompt}\n\nInformación del catálogo:\n${contextText}\n\nPregunta del usuario: ${userMessage}\n\nRespuesta (texto natural, sin JSON):`

    const response = await fetchWithTimeout(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: OLLAMA_MODEL,
            prompt,
            stream: false,
            options: {
                temperature: 0.3
            }
        })
    })

    if (!response.ok) {
        const body = await response.text().catch(() => '')
        throw new Error(`Ollama generate error: ${response.status} ${response.statusText} | ${body}`)
    }

    const data = await response.json()
    return cleanResponse(data.response)
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

async function classifyIntent(userMessage) {
    const prompt = `[INST] <<SYS>>
You are a classifier for a cinema chatbot. Answer ONLY with "catalogo" or "otro".
- catalogo: ANY question about movies, cinema, film recommendations, actors, directors, genres, showtimes, prices, stores, promotions, opinions about films, film comparisons, or anything related to movies/cinema.
- otro: sports, politics, weather, music, cooking, tech, health, math, calculations, science, news, games, or any topic NOT related to cinema or movies.
<</SYS>>

Mensaje: "${userMessage}"
Respuesta: [/INST]`

    const response = await fetchWithTimeout(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: CLASSIFY_MODEL,
            prompt,
            stream: false,
            options: { temperature: 0.1 }
        })
    }, CLASSIFY_TIMEOUT_MS)

    if (!response.ok) {
        const body = await response.text().catch(() => '')
        throw new Error(`Ollama classify error: ${response.status} ${response.statusText} | ${body}`)
    }

    const data = await response.json()
    const result = data.response.trim().toLowerCase().replace(/[^a-záéíóúñ]/g, '')

    if (result.includes('catalogo')) return 'catalogo'
    return 'otro'
}

module.exports = { generateResponse, classifyIntent }
