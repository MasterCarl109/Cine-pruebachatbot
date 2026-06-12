const express = require('express')
const rateLimit = require('express-rate-limit')
const User = require('../models/User')
const Session = require('../models/Session')
const { authenticate } = require('../middleware/auth')
const { loginRules } = require('../middleware/validate')

const router = express.Router()

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' }
})

router.post('/login', loginLimiter, loginRules, async (req, res) => {
    try {
        const { email, password } = req.body

        const user = await User.findOne({ email }).populate('store', 'name')
        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas' })
        }

        if (!user.active) {
            return res.status(401).json({ error: 'Cuenta desactivada. Contacta al administrador.' })
        }

        if (user.role === 'client') {
            return res.status(401).json({ error: 'Credenciales inválidas' })
        }

        const isMatch = await user.comparePassword(password)
        if (!isMatch) {
            return res.status(401).json({ error: 'Credenciales inválidas' })
        }

        const session = await Session.create({
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                store: user.store?._id || user.store,
                type: 'staff'
            }
        })

        res.cookie('token', session.token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000
        })

        res.json({
            user: {
                email: user.email,
                name: user.name,
                role: user.role,
                store: user.store,
                type: 'staff'
            },
            socketToken: session.token
        })
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' })
    }
})

router.get('/socket-token', async (req, res) => {
    try {
        const token = req.cookies?.token
        if (!token) return res.status(401).json({ error: 'No hay sesión activa' })

        const session = await Session.findOne({ token }).lean()
        if (!session || session.expiresAt < new Date()) {
            return res.status(401).json({ error: 'Sesión inválida o expirada' })
        }

        res.json({ token })
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' })
    }
})

router.get('/me', authenticate, async (req, res) => {
    try {
        if (req.user.type !== 'staff' && !['admin', 'manager', 'employee'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Solo personal puede acceder a este perfil' })
        }
        const user = await User.findById(req.user.id).select('name email role store').populate('store', 'name').lean()
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })
        res.json({ user: { ...user, type: 'staff' } })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.post('/logout', async (req, res) => {
    const token = req.cookies?.token
    if (token) {
        await Session.deleteOne({ token })
    }
    res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' })
    res.json({ mensaje: 'Sesión cerrada' })
})

module.exports = router
