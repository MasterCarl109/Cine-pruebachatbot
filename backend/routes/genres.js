const express = require('express')
const Genre = require('../models/Genre')
const { authenticate, requireRole } = require('../middleware/auth')

const router = express.Router()

router.get('/', async (req, res) => {
    try {
        const genres = await Genre.find().sort({ name: 1 })
        res.json(genres)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.get('/:id', async (req, res) => {
    try {
        const genre = await Genre.findById(req.params.id)
        if (!genre) return res.status(404).json({ error: 'Género no encontrado' })
        res.json(genre)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.post('/', authenticate, requireRole('admin', 'manager'), async (req, res) => {
    try {
        const genre = new Genre(req.body)
        await genre.save()
        res.status(201).json(genre)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

router.put('/:id', authenticate, requireRole('admin', 'manager'), async (req, res) => {
    try {
        const genre = await Genre.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        if (!genre) return res.status(404).json({ error: 'Género no encontrado' })
        res.json(genre)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const genre = await Genre.findByIdAndDelete(req.params.id)
        if (!genre) return res.status(404).json({ error: 'Género no encontrado' })
        res.json({ mensaje: 'Género eliminado' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

module.exports = router
