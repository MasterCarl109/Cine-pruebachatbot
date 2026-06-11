const express = require('express')
const Movie = require('../models/Movie')
const { authenticate, requireRole } = require('../middleware/auth')
const { movieRules, movieUpdateRules, offerRules, offerUpdateRules, mongoIdParam } = require('../middleware/validate')

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
            .populate('offers.store', 'name')
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
            .populate('offers.store', 'name')
        if (!movie) return res.status(404).json({ error: 'Película no encontrada' })
        res.json(movie)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.post('/', authenticate, requireRole('admin', 'manager'), movieRules, async (req, res) => {
    try {
        const movie = new Movie(req.body)
        await movie.save()
        res.status(201).json(movie)
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

router.put('/:id', authenticate, requireRole('admin', 'manager'), movieUpdateRules, async (req, res) => {
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

// ============================================================
// OFFERS CRUD (embedded in Movie)
// ============================================================

function validateOffer(req, body) {
    const { store, description, discountPercent, startDate, endDate, active } = body
    if (!description || discountPercent == null || !startDate || !endDate) {
        return 'Faltan campos requeridos (description, discountPercent, startDate, endDate)'
    }
    if (discountPercent < 1 || discountPercent > 100) {
        return 'discountPercent debe estar entre 1 y 100'
    }
    if (new Date(startDate) >= new Date(endDate)) {
        return 'startDate debe ser anterior a endDate'
    }
    if (req.user.role !== 'admin') {
        if (!store) {
            return 'Manager debe especificar una tienda para la oferta'
        }
        const userStoreId = String(req.user.store?._id || req.user.store)
        if (String(store) !== userStoreId) {
            return 'Manager solo puede crear ofertas para su propia tienda'
        }
    }
    return null
}

router.post('/:movieId/offers', authenticate, requireRole('admin', 'manager'), mongoIdParam('movieId'), offerRules, async (req, res) => {
    try {
        const error = validateOffer(req, req.body)
        if (error) return res.status(400).json({ error })

        const movie = await Movie.findById(req.params.movieId)
        if (!movie) return res.status(404).json({ error: 'Película no encontrada' })

        movie.offers.push({
            store: req.body.store || null,
            description: req.body.description,
            discountPercent: req.body.discountPercent,
            startDate: new Date(req.body.startDate),
            endDate: new Date(req.body.endDate),
            active: req.body.active !== false
        })
        await movie.save()

        const updated = await Movie.findById(movie._id)
            .populate('offers.store', 'name')

        res.status(201).json(updated.offers)
    } catch (error) {
        console.error('Error al crear oferta:', error)
        res.status(500).json({ error: error.message })
    }
})

router.put('/:movieId/offers/:offerIdx', authenticate, requireRole('admin', 'manager'), mongoIdParam('movieId'), offerUpdateRules, async (req, res) => {
    try {
        const idx = parseInt(req.params.offerIdx, 10)
        const error = validateOffer(req, req.body)
        if (error) return res.status(400).json({ error })

        const movie = await Movie.findById(req.params.movieId)
        if (!movie) return res.status(404).json({ error: 'Película no encontrada' })
        if (!movie.offers[idx]) return res.status(404).json({ error: 'Oferta no encontrada' })

        const offerPath = `offers.${idx}`
        await Movie.findByIdAndUpdate(req.params.movieId, {
            $set: {
                [offerPath]: {
                    store: req.body.store || null,
                    description: req.body.description,
                    discountPercent: req.body.discountPercent,
                    startDate: new Date(req.body.startDate),
                    endDate: new Date(req.body.endDate),
                    active: req.body.active !== false
                }
            }
        })

        const updated = await Movie.findById(req.params.movieId)
            .populate('offers.store', 'name')

        res.json(updated.offers)
    } catch (error) {
        console.error('Error al actualizar oferta:', error)
        res.status(500).json({ error: error.message })
    }
})

router.delete('/:movieId/offers/:offerIdx', authenticate, requireRole('admin', 'manager'), async (req, res) => {
    try {
        const idx = parseInt(req.params.offerIdx, 10)

        const movie = await Movie.findById(req.params.movieId)
        if (!movie) return res.status(404).json({ error: 'Película no encontrada' })
        if (!movie.offers[idx]) return res.status(404).json({ error: 'Oferta no encontrada' })

        movie.offers.splice(idx, 1)
        await movie.save()

        const updated = await Movie.findById(movie._id)
            .populate('offers.store', 'name')

        res.json(updated.offers)
    } catch (error) {
        console.error('Error al eliminar oferta:', error)
        res.status(500).json({ error: error.message })
    }
})

module.exports = router
