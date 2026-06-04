const jwt = require('jsonwebtoken')

function authenticate(req, res, next) {
    const header = req.headers.authorization
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token no proporcionado' })
    }

    try {
        const token = header.split(' ')[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded
        next()
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido o expirado' })
    }
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
