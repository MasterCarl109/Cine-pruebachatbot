const crypto = require('crypto')
const express = require('express')
const rateLimit = require('express-rate-limit')
const Client = require('../models/Client')
const Session = require('../models/Session')
const { authenticate, requireRole } = require('../middleware/auth')
const { registerRules, clientLoginRules } = require('../middleware/validate')

const router = express.Router()

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' }
})

function generateCardNumber(length = 16) {
    let num = ''
    for (let i = 0; i < length; i++) {
        num += crypto.randomInt(0, 10).toString()
    }
    return num
}

async function generateUniqueCardNumber() {
    for (let attempt = 0; attempt < 50; attempt++) {
        const num = generateCardNumber()
        const exists = await Client.findOne({ 'virtualCard.cardNumber': num })
        if (!exists) return num
    }
    throw new Error('No se pudo generar un número de tarjeta único')
}

router.post('/register', authLimiter, registerRules, async (req, res) => {
    try {
        const { email, password, name, pin } = req.body
        const cardNumber = await generateUniqueCardNumber()
        const client = new Client({
            email, password, name,
            virtualCard: { cardNumber, pin, balance: 100000 }
        })
        await client.save()
        res.status(201).json({
            mensaje: 'Cuenta creada exitosamente',
            cardNumber
        })
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'El email ya está registrado' })
        }
        res.status(400).json({ error: error.message })
    }
})

router.post('/login', authLimiter, clientLoginRules, async (req, res) => {
    try {
        const { email, password } = req.body

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
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000
        })

        res.json({
            user: {
                id: client._id,
                email: client.email,
                name: client.name,
                role: 'client',
                type: 'client'
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

router.post('/logout', async (req, res) => {
    const token = req.cookies?.token
    if (token) {
        await Session.deleteOne({ token })
    }
    res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' })
    res.json({ mensaje: 'Sesión cerrada' })
})

router.get('/me', authenticate, async (req, res) => {
    try {
        if (req.user.type !== 'client') {
            return res.status(403).json({ error: 'Solo clientes pueden acceder a este perfil' })
        }
        const client = await Client.findById(req.user.id).select('name email virtualCard.cardNumber virtualCard.balance')
        if (!client) return res.status(404).json({ error: 'Cliente no encontrado' })
        res.json({
            id: client._id,
            name: client.name,
            email: client.email,
            cardNumber: client.virtualCard.cardNumber,
            balance: client.virtualCard.balance,
            lastDigits: client.virtualCard.cardNumber.slice(-4),
            type: 'client',
            role: 'client'
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
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
