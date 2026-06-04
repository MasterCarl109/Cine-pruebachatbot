const mongoose = require('mongoose')

const directorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    nationality: { type: String },
    biography: { type: String }
}, { timestamps: true })

directorSchema.index({ name: 'text' })

module.exports = mongoose.model('Director', directorSchema)
