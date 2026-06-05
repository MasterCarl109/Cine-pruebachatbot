const express = require('express')
const rateLimit = require('express-rate-limit')
const User = require('../models/User')
const Session = require('../models/Session')

const router = express.Router()

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' }
})

router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' })
        }

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
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000
        })

        res.json({
            user: {
                email: user.email,
                name: user.name,
                role: user.role,
                store: user.store,
                type: 'staff'
            }
        })
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' })
    }
})

router.post('/logout', async (req, res) => {
    const token = req.cookies?.token
    if (token) {
        await Session.deleteOne({ token })
    }
    res.clearCookie('token', { httpOnly: true, sameSite: 'strict' })
    res.json({ mensaje: 'Sesión cerrada' })
})

module.exports = router
