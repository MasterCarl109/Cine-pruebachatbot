const { body, param, query, validationResult } = require('express-validator')

function handleValidation(req, res, next) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Datos inválidos', details: errors.array() })
    }
    next()
}

function isMongoId(value) {
    return /^[0-9a-fA-F]{24}$/.test(value)
}

/* ---- Auth ---- */
const loginRules = [
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Contraseña requerida'),
    handleValidation
]

/* ---- Client Auth ---- */
const registerRules = [
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('Contraseña debe tener al menos 6 caracteres'),
    body('name').trim().notEmpty().withMessage('Nombre requerido'),
    body('pin').matches(/^\d{6}$/).withMessage('PIN debe tener exactamente 6 dígitos'),
    handleValidation
]

const clientLoginRules = [
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Contraseña requerida'),
    handleValidation
]

/* ---- Movies ---- */
const movieRules = [
    body('title').trim().notEmpty().withMessage('Título requerido'),
    body('price').isFloat({ min: 1 }).withMessage('Precio debe ser mayor a 0'),
    body('director').custom(isMongoId).withMessage('Director inválido'),
    body('genres').isArray({ min: 1 }).withMessage('Debe incluir al menos un género'),
    body('duration').isInt({ min: 1 }).withMessage('Duración debe ser un número positivo'),
    body('synopsis').trim().notEmpty().withMessage('Sinopsis requerida'),
    handleValidation
]

const movieUpdateRules = [
    body('title').optional().trim().notEmpty().withMessage('Título no puede estar vacío'),
    body('price').optional().isFloat({ min: 1 }).withMessage('Precio debe ser mayor a 0'),
    body('director').optional().custom(isMongoId).withMessage('Director inválido'),
    body('genres').optional().isArray({ min: 1 }).withMessage('Debe incluir al menos un género'),
    body('duration').optional().isInt({ min: 1 }).withMessage('Duración debe ser un número positivo'),
    handleValidation
]

const offerRules = [
    body('description').trim().notEmpty().withMessage('Descripción requerida'),
    body('discountPercent').isInt({ min: 1, max: 100 }).withMessage('Descuento debe ser entre 1 y 100'),
    body('startDate').isISO8601().withMessage('Fecha de inicio inválida'),
    body('endDate').isISO8601().withMessage('Fecha de fin inválida'),
    handleValidation
]

const offerUpdateRules = [
    body('description').optional().trim().notEmpty().withMessage('Descripción no puede estar vacía'),
    body('discountPercent').optional().isInt({ min: 1, max: 100 }).withMessage('Descuento debe ser entre 1 y 100'),
    body('startDate').optional().isISO8601().withMessage('Fecha de inicio inválida'),
    body('endDate').optional().isISO8601().withMessage('Fecha de fin inválida'),
    handleValidation
]

const mongoIdParam = (name) => [
    param(name).custom(isMongoId).withMessage(`${name} inválido`),
    handleValidation
]

/* ---- Directors ---- */
const directorRules = [
    body('name').trim().notEmpty().withMessage('Nombre requerido'),
    handleValidation
]

const directorUpdateRules = [
    body('name').optional().trim().notEmpty().withMessage('Nombre no puede estar vacío'),
    handleValidation
]

/* ---- Genres ---- */
const genreRules = [
    body('name').trim().notEmpty().withMessage('Nombre requerido'),
    handleValidation
]

const genreUpdateRules = [
    body('name').optional().trim().notEmpty().withMessage('Nombre no puede estar vacío'),
    handleValidation
]

/* ---- Stores ---- */
const storeRules = [
    body('name').trim().notEmpty().withMessage('Nombre requerido'),
    body('address').trim().notEmpty().withMessage('Dirección requerida'),
    handleValidation
]

const storeUpdateRules = [
    body('name').optional().trim().notEmpty().withMessage('Nombre no puede estar vacío'),
    body('address').optional().trim().notEmpty().withMessage('Dirección no puede estar vacía'),
    handleValidation
]

const roomRules = [
    body('name').trim().notEmpty().withMessage('Nombre de sala requerido'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacidad debe ser al menos 1'),
    handleValidation
]

const roomUpdateRules = [
    body('name').optional().trim().notEmpty().withMessage('Nombre no puede estar vacío'),
    body('capacity').optional().isInt({ min: 1 }).withMessage('Capacidad debe ser al menos 1'),
    handleValidation
]

/* ---- Reservations ---- */
const staffReserveRules = [
    body('movieId').custom(isMongoId).withMessage('Película inválida'),
    body('clientEmail').optional().isEmail().normalizeEmail().withMessage('Email del cliente inválido'),
    body('clientName').optional().trim().notEmpty().withMessage('Nombre del cliente requerido'),
    body('screeningDate').isISO8601().withMessage('Fecha inválida'),
    body('showtime').notEmpty().withMessage('Horario requerido'),
    body('room').notEmpty().withMessage('Sala requerida'),
    body('seats').isArray({ min: 1 }).withMessage('Debe reservar al menos un asiento'),
    body('seats.*.seatNumber').isInt({ min: 1 }).withMessage('Número de asiento inválido'),
    body('seats.*.ticketType').isIn(['adult', 'child']).withMessage('Tipo de boleto inválido'),
    handleValidation
]

const clientReserveRules = [
    body('movieId').custom(isMongoId).withMessage('Película inválida'),
    body('storeId').custom(isMongoId).withMessage('Tienda inválida'),
    body('screeningDate').isISO8601().withMessage('Fecha inválida'),
    body('showtime').notEmpty().withMessage('Horario requerido'),
    body('room').notEmpty().withMessage('Sala requerida'),
    body('seats').isArray({ min: 1 }).withMessage('Debe reservar al menos un asiento'),
    body('seats.*.seatNumber').isInt({ min: 1 }).withMessage('Número de asiento inválido'),
    body('seats.*.ticketType').isIn(['adult', 'child']).withMessage('Tipo de boleto inválido'),
    body('pin').matches(/^\d{6}$/).withMessage('PIN debe tener 6 dígitos'),
    handleValidation
]

const checkSeatRules = [
    query('movieId').custom(isMongoId).withMessage('Película inválida'),
    query('screeningDate').isISO8601().withMessage('Fecha inválida'),
    query('showtime').notEmpty().withMessage('Horario requerido'),
    query('room').notEmpty().withMessage('Sala requerida'),
    query('seatNumber').isInt({ min: 1 }).withMessage('Asiento inválido'),
    handleValidation
]

/* ---- Users ---- */
const userRules = [
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('Contraseña debe tener al menos 6 caracteres'),
    body('name').trim().notEmpty().withMessage('Nombre requerido'),
    body('role').isIn(['admin', 'manager', 'employee']).withMessage('Rol inválido'),
    body('store').optional({ values: 'null' }).custom((v) => v === null || isMongoId(v)).withMessage('Tienda inválida'),
    handleValidation
]

const userUpdateRules = [
    body('email').optional().isEmail().normalizeEmail().withMessage('Email inválido'),
    body('name').optional().trim().notEmpty().withMessage('Nombre no puede estar vacío'),
    body('role').optional().isIn(['admin', 'manager', 'employee']).withMessage('Rol inválido'),
    body('store').optional({ values: 'null' }).custom((v) => v === null || isMongoId(v)).withMessage('Tienda inválida'),
    body('active').optional().isBoolean().withMessage('Estado activo inválido'),
    handleValidation
]

module.exports = {
    handleValidation,
    mongoIdParam,
    loginRules,
    registerRules,
    clientLoginRules,
    movieRules,
    movieUpdateRules,
    offerRules,
    offerUpdateRules,
    directorRules,
    directorUpdateRules,
    genreRules,
    genreUpdateRules,
    storeRules,
    storeUpdateRules,
    roomRules,
    roomUpdateRules,
    staffReserveRules,
    clientReserveRules,
    checkSeatRules,
    userRules,
    userUpdateRules
}
