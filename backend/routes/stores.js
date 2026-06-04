const express = require('express')
const Store = require('../models/Store')
const { authenticate, requireRole } = require('../middleware/auth')

const router = express.Router()

router.get('/', async (req, res) => {
    try {
        const stores = await Store.find()
        res.json(stores)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.get('/:id', async (req, res) => {
    try {
        const store = await Store.findById(req.params.id)
        if (!store) return res.status(404).json({ error: 'Tienda no encontrada' })
        res.json(store)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.post('/', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const store = new Store(req.body)
        await store.save()
        res.status(201).json(store)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

router.put('/:id', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const store = await Store.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        if (!store) return res.status(404).json({ error: 'Tienda no encontrada' })
        res.json(store)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const store = await Store.findByIdAndDelete(req.params.id)
        if (!store) return res.status(404).json({ error: 'Tienda no encontrada' })
        res.json({ mensaje: 'Tienda eliminada' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

module.exports = router
