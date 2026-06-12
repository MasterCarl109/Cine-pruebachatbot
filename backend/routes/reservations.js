const express = require('express')
const router = express.Router()
const Reservation = require('../models/Reservation')
const Movie = require('../models/Movie')
const Client = require('../models/Client')
const { authenticate, requireRole } = require('../middleware/auth')
const { staffReserveRules, clientReserveRules, checkSeatRules } = require('../middleware/validate')

function sameDay(d1, d2) {
    const a = new Date(d1)
    const b = new Date(d2)
    return a.getUTCFullYear() === b.getUTCFullYear() &&
        a.getUTCMonth() === b.getUTCMonth() &&
        a.getUTCDate() === b.getUTCDate()
}

function dayRange(date) {
    const d = new Date(date)
    const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1))
    return { start, end }
}

function calcPrice(moviePrice, offers, storeId, ticketType, childDiscount = 0.30) {
    let price = moviePrice
    const activeOffer = offers.find(o =>
        o.active &&
        (!o.store || String(o.store) === String(storeId)) &&
        o.startDate <= new Date() && o.endDate >= new Date()
    )
    if (activeOffer) {
        price = price - (price * activeOffer.discountPercent / 100)
    }
    if (ticketType === 'child') {
        price = price - (price * childDiscount)
    }
    return Math.round(price)
}

async function atomicIncBookedSeats(movieId, storeId, room, date, time, increment, maxSeats) {
    const { start, end } = dayRange(date)
    const filter = {
        's.store': storeId,
        's.room': room,
        's.date': { $gte: start, $lt: end },
        's.time': time
    }
    if (maxSeats != null && increment > 0) {
        filter['s.bookedSeats'] = { $lt: maxSeats }
    }
    const result = await Movie.updateOne(
        {
            _id: movieId,
            'screenings.store': storeId,
            'screenings.room': room,
            'screenings.date': { $gte: start, $lt: end },
            'screenings.time': time
        },
        { $inc: { 'screenings.$[s].bookedSeats': increment } },
        { arrayFilters: [filter] }
    )
    return result.modifiedCount
}

router.use(authenticate)

router.post('/', requireRole('admin', 'manager', 'employee'), staffReserveRules, async (req, res) => {
    try {
        const { movieId, clientEmail, clientName, screeningDate, showtime, room, seats } = req.body

        // Validar cliente
        let client = null
        if (clientEmail) {
            client = await Client.findOne({ email: clientEmail, active: true }).lean()
            if (!client) {
                return res.status(404).json({ error: 'Cliente no encontrado.' })
            }
        }

        const movie = await Movie.findById(movieId).populate('screenings.store', 'name')
        if (!movie) return res.status(404).json({ error: 'Película no encontrada' })

        const screening = movie.screenings.find(s => {
            const sId = s.store?._id || s.store
            const dateMatch = sameDay(s.date, screeningDate)
            const timeMatch = s.time === showtime
            const roomMatch = s.room === room
            const storeMatch = String(sId) === String(req.user.store?._id || req.user.store)
            if (req.user.role === 'admin') {
                const bodyStoreMatch = String(sId) === String(req.body.storeId || sId)
                return bodyStoreMatch && dateMatch && timeMatch && roomMatch
            }
            return storeMatch && dateMatch && timeMatch && roomMatch
        })

        if (!screening) {
            return res.status(400).json({ error: 'No hay función activa para esta película en la fecha, hora, sala y tienda seleccionadas' })
        }

        const storeId = screening.store._id || screening.store
        const screeningDbDate = screening.date

        if (req.user.role !== 'admin') {
            const userStoreId = req.user.store?._id || req.user.store
            if (String(storeId) !== String(userStoreId)) {
                return res.status(403).json({ error: 'No tienes acceso a esta tienda' })
            }
        }

        // Validar asientos duplicados en la misma solicitud
        const seatNumbers = seats.map(s => s.seatNumber)
        if (new Set(seatNumbers).size !== seatNumbers.length) {
            return res.status(400).json({ error: 'No puedes reservar el mismo asiento más de una vez' })
        }

        // Verificar asientos ocupados
        const existingReservations = await Reservation.find({
            movie: movieId,
            store: storeId,
            room,
            screeningDate: screeningDbDate,
            showtime,
            seatNumber: { $in: seatNumbers },
            status: 'active'
        })
        if (existingReservations.length > 0) {
            const taken = existingReservations.map(r => r.seatNumber)
            return res.status(409).json({ error: `Los asientos ${taken.join(', ')} ya están reservados` })
        }

        // Validar capacidad
        const totalRequested = seats.length
        const availableSeats = (screening.totalSeats || 10) - (screening.bookedSeats || 0)
        if (totalRequested > availableSeats) {
            return res.status(400).json({ error: `Solo hay ${availableSeats} asientos disponibles para esta función` })
        }

        // Calcular montos por asiento
        const seatDetails = seats.map(s => ({
            seatNumber: s.seatNumber,
            ticketType: s.ticketType,
            amount: calcPrice(movie.price, movie.offers, storeId, s.ticketType, 0.20)
        }))
        const totalAmount = seatDetails.reduce((sum, s) => sum + s.amount, 0)

        // Incrementar asientos ocupados
        const modified = await atomicIncBookedSeats(movieId, storeId, room, screeningDbDate, showtime, totalRequested, screening.totalSeats)
        if (modified === 0) {
            return res.status(400).json({ error: 'No hay suficientes asientos disponibles para esta función' })
        }

        // Crear reservas
        let createdReservations
        try {
            createdReservations = await Reservation.insertMany(
                seatDetails.map(seat => ({
                    movie: movieId,
                    client: client?._id || null,
                    clientName: client ? null : (clientName || 'Sin nombre'),
                    createdBy: req.user.id,
                    store: storeId,
                    room,
                    screeningDate: screeningDbDate,
                    showtime,
                    seatNumber: seat.seatNumber,
                    ticketType: seat.ticketType,
                    amount: seat.amount,
                    paymentStatus: 'paid',
                    status: 'active'
                }))
            )
        } catch (createErr) {
            await atomicIncBookedSeats(movieId, storeId, room, screeningDbDate, showtime, -totalRequested)
            throw createErr
        }

        const populated = await Reservation.find({ _id: { $in: createdReservations.map(r => r._id) } })
            .populate('movie', 'title')
            .populate('client', 'name email')
            .populate('createdBy', 'name')
            .populate('store', 'name')

        const displayName = client ? client.name : clientName
        res.status(201).json({
            reservations: populated,
            clientName: displayName || 'Sin nombre',
            totalAmount
        })
    } catch (error) {
        console.error('Error al crear reserva:', error)
        res.status(500).json({ error: error.message })
    }
})

router.put('/:id/cancel', requireRole('admin', 'manager', 'employee'), async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id)
        if (!reservation) return res.status(404).json({ error: 'Reserva no encontrada' })

        if (req.user.role !== 'admin') {
            const userStoreId = req.user.store?._id || req.user.store
            const resStoreId = reservation.store?._id || reservation.store
            if (String(resStoreId) !== String(userStoreId)) {
                return res.status(403).json({ error: 'No tienes acceso a esta reserva (fuera de tu tienda)' })
            }
        }

        const cancelled = await Reservation.findOneAndUpdate(
            { _id: req.params.id, status: 'active' },
            { status: 'cancelled' },
            { new: true }
        )
        if (!cancelled) {
            return res.status(400).json({ error: 'La reserva ya fue cancelada o no existe' })
        }

        const resStoreId = reservation.store?._id || reservation.store
        await atomicIncBookedSeats(reservation.movie, resStoreId, reservation.room, reservation.screeningDate, reservation.showtime, -1)

        const populated = await Reservation.findById(cancelled._id)
            .populate('movie', 'title')
            .populate('client', 'name email')
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

        const reservations = await Reservation.find({ client: req.user.id })
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

router.get('/check-seat', checkSeatRules, async (req, res) => {
    try {
        const { movieId, screeningDate, showtime, room, seatNumber } = req.query

        const existing = await Reservation.findOne({
            movie: movieId,
            room,
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

// ============================================================
// GET occupied seats for a screening (client-accessible)
// ============================================================
router.get('/occupied', async (req, res) => {
    try {
        const { movieId, storeId, screeningDate, showtime, room } = req.query

        const movie = await Movie.findById(movieId)
        if (!movie) return res.status(404).json({ error: 'Película no encontrada' })

        const screening = movie.screenings.find(s => {
            const sId = s.store?._id || s.store
            return String(sId) === String(storeId) &&
                s.room === room &&
                sameDay(s.date, screeningDate) &&
                s.time === showtime
        })
        if (!screening) return res.status(404).json({ error: 'Función no encontrada' })

        const occupied = await Reservation.find({
            movie: movieId,
            store: storeId,
            room,
            screeningDate: screening.date,
            showtime,
            status: 'active'
        }).select('seatNumber').lean()

        res.json({ occupied: occupied.map(r => r.seatNumber), totalSeats: screening.totalSeats, bookedSeats: screening.bookedSeats })
    } catch (error) {
        console.error('Error al obtener asientos ocupados:', error)
        res.status(500).json({ error: error.message })
    }
})

// ============================================================
// CLIENT SELF-RESERVE with payment (multi-seat + children discount)
// ============================================================

router.post('/client-reserve', clientReserveRules, async (req, res) => {
    try {
        if (req.user.type !== 'client') {
            return res.status(403).json({ error: 'Solo clientes pueden usar esta función' })
        }

        const { movieId, storeId, screeningDate, showtime, room, seats, pin } = req.body

        const client = await Client.findById(req.user.id)
        if (!client) return res.status(404).json({ error: 'Cliente no encontrado' })

        const pinMatch = await client.comparePin(pin)
        if (!pinMatch) return res.status(401).json({ error: 'PIN incorrecto' })

        const movie = await Movie.findById(movieId)
        if (!movie) return res.status(404).json({ error: 'Película no encontrada' })

        const screening = movie.screenings.find(s => {
            const sId = s.store?._id || s.store
            return String(sId) === String(storeId) &&
                s.room === room &&
                sameDay(s.date, screeningDate) &&
                s.time === showtime
        })

        if (!screening) {
            return res.status(400).json({ error: 'No hay función activa para esta película en los datos seleccionados' })
        }

        const screeningDbDate = screening.date

        const seatNumbers = seats.map(s => s.seatNumber)
        const existingReservations = await Reservation.find({
            movie: movieId,
            store: storeId,
            room,
            screeningDate: screeningDbDate,
            showtime,
            seatNumber: { $in: seatNumbers },
            status: 'active'
        })

        if (existingReservations.length > 0) {
            const taken = existingReservations.map(r => r.seatNumber)
            return res.status(409).json({ error: `Los asientos ${taken.join(', ')} ya están reservados` })
        }

        let totalAmount = 0
        const seatDetails = seats.map(s => {
            const amount = calcPrice(movie.price, movie.offers, storeId, s.ticketType)
            totalAmount += amount
            return { seatNumber: s.seatNumber, ticketType: s.ticketType, amount }
        })

        if (client.virtualCard.balance < totalAmount) {
            return res.status(400).json({ error: `Saldo insuficiente. Necesitas $${totalAmount} pero tienes $${client.virtualCard.balance}` })
        }

        const modified = await atomicIncBookedSeats(movieId, storeId, room, screeningDbDate, showtime, seats.length, screening.totalSeats)
        if (modified === 0) {
            return res.status(400).json({ error: `No hay suficientes asientos disponibles para esta función` })
        }

        let createdReservations
        try {
            createdReservations = await Reservation.insertMany(
                seatDetails.map(seat => ({
                    movie: movieId,
                    client: client._id,
                    createdBy: null,
                    store: storeId,
                    room,
                    screeningDate: screeningDbDate,
                    showtime,
                    seatNumber: seat.seatNumber,
                    ticketType: seat.ticketType,
                    amount: seat.amount,
                    paymentStatus: 'paid',
                    status: 'active'
                }))
            )
        } catch (createErr) {
            await atomicIncBookedSeats(movieId, storeId, room, screeningDbDate, showtime, -seats.length)
            throw createErr
        }

        await Client.findByIdAndUpdate(client._id, {
            $inc: { 'virtualCard.balance': -totalAmount }
        })

        const populated = await Reservation.find({ _id: { $in: createdReservations.map(r => r._id) } })
            .populate('movie', 'title')
            .populate('store', 'name')

        const updatedClient = await Client.findById(client._id)

        res.status(201).json({
            reservations: populated,
            totalAmount,
            newBalance: updatedClient.virtualCard.balance
        })
    } catch (error) {
        console.error('Error en reserva de cliente:', error)
        res.status(500).json({ error: error.message })
    }
})

// ============================================================
// CLIENT CANCEL with refund
// ============================================================
router.put('/:id/client-cancel', async (req, res) => {
    try {
        if (req.user.type !== 'client') {
            return res.status(403).json({ error: 'Solo clientes pueden cancelar sus propias reservas' })
        }

        const reservation = await Reservation.findById(req.params.id)
        if (!reservation) return res.status(404).json({ error: 'Reserva no encontrada' })

        if (String(reservation.client) !== String(req.user.id)) {
            return res.status(403).json({ error: 'Esta reserva no te pertenece' })
        }

        const cancelled = await Reservation.findOneAndUpdate(
            { _id: req.params.id, status: 'active' },
            { status: 'cancelled', paymentStatus: 'refunded' },
            { new: true }
        )
        if (!cancelled) {
            return res.status(400).json({ error: 'La reserva ya fue cancelada' })
        }

        await Client.findByIdAndUpdate(req.user.id, {
            $inc: { 'virtualCard.balance': cancelled.amount }
        })

        const resStoreId = cancelled.store?._id || cancelled.store
        await atomicIncBookedSeats(cancelled.movie, resStoreId, cancelled.room, cancelled.screeningDate, cancelled.showtime, -1)

        const populated = await Reservation.findById(cancelled._id)
            .populate('movie', 'title')
            .populate('store', 'name')

        res.json({ reservation: populated, refunded: cancelled.amount })
    } catch (error) {
        console.error('Error al cancelar reserva:', error)
        res.status(500).json({ error: error.message })
    }
})

module.exports = router
