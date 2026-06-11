const mongoose = require('mongoose')

const offerSchema = new mongoose.Schema({
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', default: null },
    description: { type: String, required: true },
    discountPercent: { type: Number, required: true, min: 1, max: 100 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    active: { type: Boolean, default: true }
}, { _id: false })

const screeningSchema = new mongoose.Schema({
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    room: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    totalSeats: { type: Number, default: 10 },
    bookedSeats: { type: Number, default: 0 }
}, { _id: false })

const movieSchema = new mongoose.Schema({
    title: { type: String, required: true },
    releaseDate: { type: Date },
    synopsis: { type: String },
    duration: { type: Number },
    rating: { type: String, enum: ['G', 'PG', 'PG-13', 'R', 'NC-17'] },
    poster: { type: String },
    price: { type: Number, required: true, min: 0 },
    director: { type: mongoose.Schema.Types.ObjectId, ref: 'Director' },
    genres: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Genre' }],
    screenings: [screeningSchema],
    offers: [offerSchema]
}, { timestamps: true })

movieSchema.index({ title: 'text', synopsis: 'text' })
movieSchema.index({ 'screenings.store': 1, 'screenings.room': 1, 'screenings.date': 1, 'screenings.time': 1 }, { unique: true })

module.exports = mongoose.model('Movie', movieSchema)
