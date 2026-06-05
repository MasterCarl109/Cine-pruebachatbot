const Session = require('../models/Session')

function authenticate(req, res, next) {
    const token = req.cookies?.token

    if (!token) {
        return res.status(401).json({ error: 'Sesión no encontrada' })
    }

    Session.findOne({ token }).lean().then(session => {
        if (!session || session.expiresAt < new Date()) {
            return res.status(401).json({ error: 'Sesión inválida o expirada' })
        }
        req.user = session.user
        next()
    }).catch(err => {
        res.status(500).json({ error: 'Error de autenticación' })
    })
}

function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Autenticación requerida' })
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: `Acceso denegado: se requiere rol ${roles.join(' o ')}` })
        }
        next()
    }
}

function requireStoreAccess(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Autenticación requerida' })
    }
    if (req.user.role === 'admin') {
        return next()
    }
    const storeId = req.body.store || req.params.storeId || req.query.store
    if (!storeId) {
        return res.status(400).json({ error: 'Tienda no especificada' })
    }
    if (String(req.user.store) !== String(storeId)) {
        return res.status(403).json({ error: 'No tienes acceso a esta tienda' })
    }
    next()
}

module.exports = { authenticate, requireRole, requireStoreAccess }
