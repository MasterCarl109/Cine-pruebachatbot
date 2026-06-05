const mongoose = require('mongoose')

const screeningSchema = new mongoose.Schema({
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
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
    director: { type: mongoose.Schema.Types.ObjectId, ref: 'Director' },
    genres: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Genre' }],
    screenings: [screeningSchema]
}, { timestamps: true })

movieSchema.index({ title: 'text', synopsis: 'text' })

module.exports = mongoose.model('Movie', movieSchema)
