const express = require('express')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

const router = express.Router()

router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body
        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, contraseña y nombre son requeridos' })
        }
        const user = new User({ email, password, name, role: 'client' })
        await user.save()

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role, name: user.name, store: null },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        )

        res.status(201).json({
            token,
            user: { email: user.email, name: user.name, role: user.role, store: null }
        })
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'El email ya está registrado' })
        }
        res.status(400).json({ error: error.message })
    }
})

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' })
        }

        const user = await User.findOne({ email })
        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas' })
        }

        if (!user.active) {
            return res.status(401).json({ error: 'Cuenta desactivada. Contacta al administrador.' })
        }

        const isMatch = await user.comparePassword(password)
        if (!isMatch) {
            return res.status(401).json({ error: 'Credenciales inválidas' })
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role, name: user.name, store: user.store },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        )

        res.json({
            token,
            user: {
                email: user.email,
                name: user.name,
                role: user.role,
                store: user.store
            }
        })
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' })
    }
})

module.exports = router
