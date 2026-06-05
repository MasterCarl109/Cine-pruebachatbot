const mongoose = require('mongoose')

const reservationSchema = new mongoose.Schema({
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    screeningDate: { type: Date, required: true },
    showtime: { type: String, required: true },
    seatNumber: { type: Number, required: true, min: 1, max: 10 },
    status: { type: String, enum: ['active', 'cancelled'], default: 'active' }
}, { timestamps: true })

reservationSchema.index({ movie: 1, store: 1, screeningDate: 1, showtime: 1, seatNumber: 1, status: 1 })

module.exports = mongoose.model('Reservation', reservationSchema)
