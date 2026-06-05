const express = require('express')
const router = express.Router()
const Reservation = require('../models/Reservation')
const Movie = require('../models/Movie')
const Client = require('../models/Client')
const { authenticate, requireRole, requireStoreAccess } = require('../middleware/auth')

router.use(authenticate)

router.post('/', requireRole('admin', 'manager', 'employee'), async (req, res) => {
    try {
        const { movieId, clientEmail, screeningDate, showtime, seatNumber } = req.body
        if (!movieId || !clientEmail || !screeningDate || !showtime || !seatNumber) {
            return res.status(400).json({ error: 'Faltan campos requeridos' })
        }

        const client = await Client.findOne({ email: clientEmail, active: true })
        if (!client) {
            return res.status(404).json({ error: 'Cliente no encontrado. El cliente debe estar registrado.' })
        }

        const movie = await Movie.findById(movieId).populate('screenings.store', 'name')
        if (!movie) return res.status(404).json({ error: 'Película no encontrada' })

        const sDate = new Date(screeningDate)
        sDate.setHours(0, 0, 0, 0)

        const screening = movie.screenings.find(s => {
            const sId = s.store?._id || s.store
            const sDateOnly = new Date(s.date)
            sDateOnly.setHours(0, 0, 0, 0)
            const dateMatch = sDateOnly.getTime() === sDate.getTime()
            const timeMatch = s.time === showtime
            const storeMatch = String(sId) === String(req.user.store?._id || req.user.store)
            if (req.user.role === 'admin') {
                const bodyStoreMatch = String(sId) === String(req.body.storeId || sId)
                return bodyStoreMatch && dateMatch && timeMatch
            }
            return storeMatch && dateMatch && timeMatch
        })

        if (!screening) {
            return res.status(400).json({ error: 'No hay función activa para esta película en la fecha, hora y tienda seleccionadas' })
        }

        if (screening.bookedSeats >= screening.totalSeats) {
            return res.status(400).json({ error: 'No hay asientos disponibles para esta función' })
        }

        const existing = await Reservation.findOne({
            movie: movieId,
            store: screening.store._id || screening.store,
            screeningDate: sDate,
            showtime,
            seatNumber,
            status: 'active'
        })
        if (existing) {
            return res.status(409).json({ error: `El asiento ${seatNumber} ya está reservado para esta función` })
        }

        const storeId = screening.store._id || screening.store

        if (req.user.role !== 'admin') {
            const userStoreId = req.user.store?._id || req.user.store
            if (String(storeId) !== String(userStoreId)) {
                return res.status(403).json({ error: 'No tienes acceso a esta tienda' })
            }
        }

        const reservation = await Reservation.create({
            movie: movieId,
            client: client._id,
            createdBy: req.user.id,
            store: storeId,
            screeningDate: sDate,
            showtime,
            seatNumber,
            status: 'active'
        })

        await Movie.findOneAndUpdate(
            { _id: movieId, 'screenings.store': storeId, 'screenings.date': sDate, 'screenings.time': showtime },
            { $inc: { 'screenings.$[s].bookedSeats': 1 } },
            { arrayFilters: [{ 's.store': storeId, 's.date': sDate, 's.time': showtime }] }
        )

        const populated = await Reservation.findById(reservation._id)
            .populate('movie', 'title')
            .populate('client', 'name email')
            .populate('createdBy', 'name')
            .populate('store', 'name')

        res.status(201).json(populated)
    } catch (error) {
        console.error('Error al crear reserva:', error)
        res.status(500).json({ error: error.message })
    }
})

router.put('/:id/cancel', requireRole('admin', 'manager', 'employee'), async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id)
        if (!reservation) return res.status(404).json({ error: 'Reserva no encontrada' })

        if (reservation.status !== 'active') {
            return res.status(400).json({ error: 'La reserva ya fue cancelada' })
        }

        if (req.user.role !== 'admin') {
            const userStoreId = req.user.store?._id || req.user.store
            const resStoreId = reservation.store?._id || reservation.store
            if (String(resStoreId) !== String(userStoreId)) {
                return res.status(403).json({ error: 'No tienes acceso a esta reserva' })
            }
        }

        reservation.status = 'cancelled'
        await reservation.save()

        const resDate = new Date(reservation.screeningDate)
        resDate.setHours(0, 0, 0, 0)
        const resStoreId = reservation.store?._id || reservation.store
        await Movie.findOneAndUpdate(
            { _id: reservation.movie, 'screenings.store': resStoreId, 'screenings.date': resDate, 'screenings.time': reservation.showtime },
            { $inc: { 'screenings.$[s].bookedSeats': -1 } },
            { arrayFilters: [{ 's.store': resStoreId, 's.date': resDate, 's.time': reservation.showtime }] }
        )

        const populated = await Reservation.findById(reservation._id)
            .populate('movie', 'title')
            .populate('client', 'name email')
            .populate('createdBy', 'name')
            .populate('store', 'name')

        res.json(populated)
    } catch (error) {
        console.error('Error al cancelar reserva:', error)
        res.status(500).json({ error: error.message })
    }
})

router.get('/', requireRole('admin', 'manager', 'employee'), async (req, res) => {
    try {
        const filter = {}
        if (req.query.movieId) filter.movie = req.query.movieId
        if (req.query.storeId) filter.store = req.query.storeId
        if (req.query.status) filter.status = req.query.status
        if (req.query.clientId) filter.client = req.query.clientId
        if (req.query.screeningDate) {
            const d = new Date(req.query.screeningDate)
            filter.screeningDate = { $gte: d, $lt: new Date(d.getTime() + 86400000) }
        }

        if (req.user.role !== 'admin') {
            const userStoreId = req.user.store?._id || req.user.store
            filter.store = userStoreId
        }

        const reservations = await Reservation.find(filter)
            .populate('movie', 'title')
            .populate('client', 'name email')
            .populate('createdBy', 'name')
            .populate('store', 'name')
            .sort({ createdAt: -1 })

        res.json(reservations)
    } catch (error) {
        console.error('Error al listar reservas:', error)
        res.status(500).json({ error: error.message })
    }
})

router.get('/mine', async (req, res) => {
    try {
        if (req.user.type !== 'client') {
            return res.status(403).json({ error: 'Solo clientes pueden ver sus reservas' })
        }

        const reservations = await Reservation.find({ client: req.user.id, status: 'active' })
            .populate('movie', 'title poster')
            .populate('store', 'name')
            .populate('createdBy', 'name')
            .sort({ screeningDate: -1 })

        res.json(reservations)
    } catch (error) {
        console.error('Error al obtener mis reservas:', error)
        res.status(500).json({ error: error.message })
    }
})

router.get('/check-seat', async (req, res) => {
    try {
        const { movieId, screeningDate, showtime, seatNumber } = req.query
        if (!movieId || !screeningDate || !showtime || !seatNumber) {
            return res.status(400).json({ error: 'Faltan parámetros' })
        }

        const existing = await Reservation.findOne({
            movie: movieId,
            screeningDate: new Date(screeningDate),
            showtime,
            seatNumber: Number(seatNumber),
            status: 'active'
        })

        res.json({ available: !existing })
    } catch (error) {
        console.error('Error al verificar asiento:', error)
        res.status(500).json({ error: error.message })
    }
})

module.exports = router
