const express = require('express')
const User = require('../models/User')
const { userRules, userUpdateRules } = require('../middleware/validate')

const router = express.Router()

router.get('/', async (req, res) => {
    try {
        const users = await User.find().select('-password').populate('store', 'name')
        res.json(users)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password').populate('store', 'name')
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })
        res.json(user)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.post('/', userRules, async (req, res) => {
    try {
        const { email, password, name, role, store } = req.body
        if (role === 'client') {
            return res.status(400).json({ error: 'Los clientes se registran desde el portal público' })
        }
        if ((role === 'manager' || role === 'employee') && !store) {
            return res.status(400).json({ error: 'Tienda es requerida para manager y employee' })
        }
        const user = new User({ email, password, name, role, store: store || null })
        await user.save()
        const userData = user.toObject()
        delete userData.password
        res.status(201).json(userData)
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'El email ya está registrado' })
        }
        res.status(400).json({ error: error.message })
    }
})

router.put('/:id', userUpdateRules, async (req, res) => {
    try {
        const { email, name, role, store, active } = req.body
        const updates = {}
        if (email) updates.email = email
        if (name) updates.name = name
        if (role) updates.role = role
        if (store !== undefined) updates.store = store
        if (active !== undefined) updates.active = active

        const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
            .select('-password')
            .populate('store', 'name')
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })
        res.json(user)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

router.delete('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })
        if (user.role === 'admin') {
            const adminCount = await User.countDocuments({ role: 'admin' })
            if (adminCount <= 1) {
                return res.status(400).json({ error: 'No puedes eliminar al último administrador' })
            }
        }
        await User.findByIdAndDelete(req.params.id)
        res.json({ mensaje: 'Usuario eliminado' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

module.exports = router
