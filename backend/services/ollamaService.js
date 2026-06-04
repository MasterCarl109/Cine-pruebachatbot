const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:1b'

async function generateResponse(systemPrompt, context, userMessage) {
    const contextText = buildContextText(context)
    const prompt = `${systemPrompt}\n\nInformación del catálogo:\n${contextText}\n\nPregunta del usuario: ${userMessage}\n\nRespuesta (texto natural, sin JSON):`

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
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
        throw new Error(`Ollama error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return cleanResponse(data.response)
}

function buildContextText(context) {
    const parts = []
    if (context.peliculas_encontradas?.length) {
        parts.push('Películas disponibles en el catálogo:')
        context.peliculas_encontradas.forEach(m => {
            let line = `- "${m.titulo}" - ${m.sinopsis}. Director: ${m.director}. Géneros: ${m.generos?.join(', ') || 'N/A'}.`
            if (m.disponibilidad?.length) {
                line += ` Disponible en: ${m.disponibilidad.map(d => `${d.tienda} (${d.copias} copias, del ${d.desde} al ${d.hasta})`).join(', ')}.`
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

const CLASSIFY_MODEL = 'deepseek-r1:7b'

async function classifyIntent(userMessage) {
    const prompt = `[INST] <<SYS>>
You are a strict classifier. Answer ONLY with the word "catalogo" or "otro".
- catalogo: questions about movies, directors, genres, stores, rental, availability, film recommendations.
- otro: EVERYTHING else: sports, politics, weather, music, cooking, tech, health, math, calculations, science, history, travel, games, news, personal questions, or any topic NOT related to a video club catalog.
<</SYS>>

Mensaje: "${userMessage}"
Respuesta: [/INST]`

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: CLASSIFY_MODEL,
            prompt,
            stream: false,
            options: { temperature: 0.1 }
        })
    })

    if (!response.ok) {
        throw new Error(`Ollama error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const result = data.response.trim().toLowerCase().replace(/[^a-záéíóúñ]/g, '')

    if (result.includes('catalogo')) return 'catalogo'
    return 'otro'
}

module.exports = { generateResponse, classifyIntent }
