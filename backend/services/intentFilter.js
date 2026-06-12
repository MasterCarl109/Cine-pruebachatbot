const MATH_EXPR = /\d+\s*[\+\-\*\/]\s*\d+/

const CINEMA_KEYWORDS = [
    'pelicula', 'peliculas', 'cine', 'cartelera',
    'funcion', 'funciones', 'horario', 'horarios',
    'boleto', 'boletos', 'entrada', 'entradas',
    'reserva', 'reservar', 'reservaciones',
    'director', 'directores', 'genero', 'generos',
    'actor', 'actriz', 'actores', 'sinopsis',
    'estreno', 'estrenos', 'estrenar',
    'recomienda', 'recomiendas', 'recomiendame',
    'recomendacion', 'recomendaciones',
    'precio', 'precios', 'cuesta', 'vale', 'cuestan',
    'asiento', 'asientos', 'sala', 'salas', 'butaca', 'butacas',
    'oferta', 'ofertas', 'descuento', 'descuentos',
    'promocion', 'promociones',
    'ver', 'mira', 'mirar',
    'drama', 'comedia', 'terror', 'accion', 'suspenso', 'aventura',
    'sucursal', 'tienda', 'sucursales',
    'disponible', 'disponibles', 'disponibilidad',
    'infantil', 'adulto', 'adultos', 'nino', 'ninos',
    'clasificacion', 'duracion', 'idioma', 'subtitulada',
    'pagar', 'pago', 'tarjeta', 'saldo', 'pin',
    'catalogo'
]

const BLACKLIST = [
    'deporte', 'fútbol', 'béisbol', 'baloncesto', 'tenis', 'f1', 'nfl', 'nba',
    'política', 'gobierno', 'presidente', 'elección', 'partido', 'votar',
    'clima', 'lluvia', 'temperatura', 'tormenta',
    'música', 'canción', 'canciones', 'álbum', 'banda', 'concierto', 'spotify', 'artista',
    'cocina', 'receta', 'recetas', 'comida', 'restaurante', 'ingrediente', 'ingredientes',
    'tecnología', 'programación', 'inteligencia artificial', 'código', 'software', 'hardware', 'javascript', 'python',
    'windows', 'linux', 'mac', 'ordenador', 'computadora',
    'salud', 'enfermedad', 'medicina', 'hospital', 'doctor',
    'economía', 'dinero', 'bolsa', 'inversión', 'criptomoneda',
    'noticia', 'noticias',
    'historia', 'guerra', 'país',
    'viaje', 'hotel', 'vuelo', 'turismo',
    'videojuego', 'playstation', 'xbox', 'nintendo',
    'matemática', 'calcular', 'suma', 'resta', 'multiplicación', 'división', 'ecuación', 'fórmula', 'álgebra', 'cálculo',
    'cuánto es', 'cuanto es', 'cuánto da', 'cuanto da', 'cuánto sale',
    'instagram', 'facebook', 'twitter', 'tiktok', 'youtube',
    'universidad', 'escuela', 'colegio', 'clase', 'profesor', 'estudiante',
    'amor', 'novio', 'novia', 'relacion', 'pareja', 'matrimonio',
    'animal', 'perro', 'gato', 'mascota',
    'ropa', 'zapatos', 'moda',
    'ejercicio', 'gimnasio', 'correr', 'nadar',
    'telefono', 'celular', 'movil', 'whatsapp',
    'trabajo', 'empleo', 'oficina', 'empresa',
    'cumpleaños', 'fiesta', 'celebracion',
    'casa', 'hogar', 'departamento',
    'coche', 'auto', 'carro', 'conducir', 'manejar'
]

function hasBlacklistedWords(message) {
    const lower = message.toLowerCase()
    if (MATH_EXPR.test(lower)) return true
    return BLACKLIST.some(word => lower.includes(word))
}

function hasCinemaKeywords(message) {
    const lower = message.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return CINEMA_KEYWORDS.some(word => lower.includes(word))
}

function isCatalogRelated(message) {
    if (hasCinemaKeywords(message)) return true
    if (hasBlacklistedWords(message)) return false
    return true
}

module.exports = { isCatalogRelated }
