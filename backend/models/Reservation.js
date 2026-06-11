const mongoose = require('mongoose')

const reservationSchema = new mongoose.Schema({
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null },
    clientName: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    room: { type: String, required: true },
    screeningDate: { type: Date, required: true },
    showtime: { type: String, required: true },
    seatNumber: { type: Number, required: true, min: 1 },
    ticketType: { type: String, enum: ['adult', 'child'], default: 'adult' },
    amount: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ['paid', 'refunded'], default: 'paid' },
    paidAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'cancelled'], default: 'active' }
}, { timestamps: true })

reservationSchema.index({ movie: 1, store: 1, room: 1, screeningDate: 1, showtime: 1, seatNumber: 1, status: 1 })

module.exports = mongoose.model('Reservation', reservationSchema)
