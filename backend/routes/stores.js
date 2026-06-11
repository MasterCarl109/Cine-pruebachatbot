const express = require('express')
const Store = require('../models/Store')
const { authenticate, requireRole, requireStoreAccess } = require('../middleware/auth')
const { storeRules, storeUpdateRules, roomRules, roomUpdateRules, mongoIdParam } = require('../middleware/validate')

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

router.post('/', authenticate, requireRole('admin'), storeRules, async (req, res) => {
    try {
        const store = new Store(req.body)
        await store.save()
        res.status(201).json(store)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

router.put('/:id', authenticate, requireRole('admin'), storeUpdateRules, async (req, res) => {
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

// ============================================================
// ROOMS CRUD (embedded in Store)
// ============================================================

router.get('/:storeId/rooms', async (req, res) => {
    try {
        const store = await Store.findById(req.params.storeId)
        if (!store) return res.status(404).json({ error: 'Tienda no encontrada' })
        res.json(store.rooms)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.post('/:storeId/rooms', authenticate, requireRole('admin', 'manager'), requireStoreAccess, mongoIdParam('storeId'), roomRules, async (req, res) => {
    try {
        const { name, capacity } = req.body

        const store = await Store.findById(req.params.storeId)
        if (!store) return res.status(404).json({ error: 'Tienda no encontrada' })

        if (store.rooms.length >= 5) {
            return res.status(400).json({ error: 'Máximo 5 salas por tienda' })
        }

        store.rooms.push({ name, capacity })
        await store.save()

        res.status(201).json(store.rooms)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.put('/:storeId/rooms/:roomId', authenticate, requireRole('admin', 'manager'), requireStoreAccess, mongoIdParam('storeId'), roomUpdateRules, async (req, res) => {
    try {
        const { name, capacity } = req.body

        const store = await Store.findById(req.params.storeId)
        if (!store) return res.status(404).json({ error: 'Tienda no encontrada' })

        const room = store.rooms.id(req.params.roomId)
        if (!room) return res.status(404).json({ error: 'Sala no encontrada' })

        if (name) room.name = name
        if (capacity != null) room.capacity = capacity
        await store.save()

        res.json(store.rooms)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.delete('/:storeId/rooms/:roomId', authenticate, requireRole('admin', 'manager'), requireStoreAccess, async (req, res) => {
    try {
        const store = await Store.findById(req.params.storeId)
        if (!store) return res.status(404).json({ error: 'Tienda no encontrada' })

        const room = store.rooms.id(req.params.roomId)
        if (!room) return res.status(404).json({ error: 'Sala no encontrada' })

        room.deleteOne()
        await store.save()

        res.json(store.rooms)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

module.exports = router
