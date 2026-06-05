const express = require('express')
const rateLimit = require('express-rate-limit')
const Client = require('../models/Client')
const Session = require('../models/Session')
const { authenticate, requireRole } = require('../middleware/auth')

const router = express.Router()

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' }
})

router.post('/register', authLimiter, async (req, res) => {
    try {
        const { email, password, name } = req.body
        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, contraseña y nombre son requeridos' })
        }
        const client = new Client({ email, password, name })
        await client.save()
        res.status(201).json({ mensaje: 'Cuenta creada exitosamente' })
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'El email ya está registrado' })
        }
        res.status(400).json({ error: error.message })
    }
})

router.post('/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' })
        }

        const client = await Client.findOne({ email })
        if (!client) {
            return res.status(401).json({ error: 'Credenciales inválidas' })
        }

        if (!client.active) {
            return res.status(401).json({ error: 'Cuenta desactivada' })
        }

        const isMatch = await client.comparePassword(password)
        if (!isMatch) {
            return res.status(401).json({ error: 'Credenciales inválidas' })
        }

        const session = await Session.create({
            user: {
                id: client._id,
                email: client.email,
                name: client.name,
                role: 'client',
                type: 'client'
            }
        })

        res.cookie('token', session.token, {
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000
        })

        res.json({
            user: {
                email: client.email,
                name: client.name,
                role: 'client',
                type: 'client'
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

router.get('/search', authenticate, requireRole('admin', 'manager', 'employee'), async (req, res) => {
    try {
        const { email } = req.query
        if (!email) return res.status(400).json({ error: 'Email requerido' })
        const client = await Client.findOne({ email: email.toLowerCase(), active: true }).select('name email')
        if (!client) return res.status(404).json({ error: 'Cliente no encontrado' })
        res.json(client)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

module.exports = router
