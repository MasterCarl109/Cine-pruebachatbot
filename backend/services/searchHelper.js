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

function levenshtein(a, b) {
    const an = a.length
    const bn = b.length
    const matrix = []
    for (let i = 0; i <= an; i++) {
        matrix[i] = [i]
    }
    for (let j = 0; j <= bn; j++) {
        matrix[0][j] = j
    }
    for (let i = 1; i <= an; i++) {
        for (let j = 1; j <= bn; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            )
        }
    }
    return matrix[an][bn]
}

function similarity(a, b) {
    if (a.length === 0 && b.length === 0) return 1
    const maxLen = Math.max(a.length, b.length)
    if (maxLen === 0) return 1
    return 1 - levenshtein(a, b) / maxLen
}

function extractKeywords(text, stopWords) {
    const normalized = text.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return normalized
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.has(word))
}

function normalizeText(text) {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function isConfirming(message, proposedTitle) {
    const lower = normalizeText(message)
    const titleLower = normalizeText(proposedTitle)
    const confirmWords = ['sí', 'si', 'simón', 'simon', 'correcto', 'exacto', 'ok', 'okay', 'dale', 'de una', 'claro', 'eso', 'esa', 'ese']
    return confirmWords.some(w => lower.includes(w)) || lower.includes(titleLower)
}

function isRejecting(message) {
    const lower = normalizeText(message)
    const rejectWords = ['no', 'nop', 'nope', 'otra', 'equivocado', 'no es', 'no era']
    return rejectWords.some(w => lower.includes(w))
}

function closestMatch(message, titles, minSimilarity = 0.8) {
    const normalizedMsg = normalizeText(message)
    const words = normalizedMsg.split(/\s+/).filter(w => w.length > 2)

    let bestTitle = null
    let bestScore = 0

    for (const title of titles) {
        const normalizedTitle = normalizeText(title)
        let maxScoreForTitle = 0

        for (const word of words) {
            const sim = similarity(word, normalizedTitle)
            if (sim > maxScoreForTitle) maxScoreForTitle = sim
        }

        if (maxScoreForTitle > bestScore) {
            bestScore = maxScoreForTitle
            bestTitle = title
        }
    }

    return bestScore >= minSimilarity ? bestTitle : null
}

module.exports = {
    escapeRegex,
    buildAccentRegex,
    levenshtein,
    similarity,
    extractKeywords,
    normalizeText,
    isConfirming,
    isRejecting,
    closestMatch
}
