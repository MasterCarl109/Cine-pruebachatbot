const express = require('express')
const Movie = require('../models/Movie')
const { authenticate, requireRole } = require('../middleware/auth')

const router = express.Router()

router.get('/', async (req, res) => {
    try {
        const { genre, store, search, all } = req.query
        let filter = {}

        if (all !== 'true') {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            filter['screenings.date'] = { $gte: today }
        }

        if (genre) filter.genres = genre
        if (store) filter['screenings.store'] = store
        if (search) filter.$text = { $search: search }

        const movies = await Movie.find(filter)
            .populate('director', 'name')
            .populate('genres', 'name')
            .populate('screenings.store', 'name')
        res.json(movies)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.get('/:id', async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id)
            .populate('director', 'name')
            .populate('genres', 'name')
            .populate('screenings.store', 'name')
        if (!movie) return res.status(404).json({ error: 'Película no encontrada' })
        res.json(movie)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.post('/', authenticate, requireRole('admin', 'manager'), async (req, res) => {
    try {
        const movie = new Movie(req.body)
        await movie.save()
        res.status(201).json(movie)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

router.put('/:id', authenticate, requireRole('admin', 'manager'), async (req, res) => {
    try {
        const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        if (!movie) return res.status(404).json({ error: 'Película no encontrada' })
        res.json(movie)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
    try {
        const movie = await Movie.findByIdAndDelete(req.params.id)
        if (!movie) return res.status(404).json({ error: 'Película no encontrada' })
        res.json({ mensaje: 'Película eliminada' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

module.exports = router
