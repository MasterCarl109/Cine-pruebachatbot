const express = require('express')
const Director = require('../models/Director')
const { authenticate, requireRole } = require('../middleware/auth')
const { directorRules, directorUpdateRules } = require('../middleware/validate')

const router = express.Router()

router.get('/', async (req, res) => {
    try {
        const { search } = req.query
        let filter = {}
        if (search) filter.$text = { $search: search }

        const directors = await Director.find(filter)
        res.json(directors)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.get('/:id', async (req, res) => {
    try {
        const director = await Director.findById(req.params.id)
        if (!director) return res.status(404).json({ error: 'Director no encontrado' })
        res.json(director)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.post('/', authenticate, requireRole('admin', 'manager'), directorRules, async (req, res) => {
    try {
        const director = new Director(req.body)
        await director.save()
        res.status(201).json(director)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

router.put('/:id', authenticate, requireRole('admin', 'manager'), directorUpdateRules, async (req, res) => {
    try {
        const director = await Director.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        if (!director) return res.status(404).json({ error: 'Director no encontrado' })
        res.json(director)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const director = await Director.findByIdAndDelete(req.params.id)
        if (!director) return res.status(404).json({ error: 'Director no encontrado' })
        res.json({ mensaje: 'Director eliminado' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

module.exports = router
