const mongoose = require('mongoose')
const crypto = require('crypto')

const sessionSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true,
        index: true,
        default: () => crypto.randomBytes(32).toString('hex')
    },
    user: {
        id: { type: mongoose.Schema.Types.ObjectId, required: true },
        email: String,
        name: String,
        role: String,
        store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
        type: { type: String, enum: ['staff', 'client'] }
    },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) }
})

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

module.exports = mongoose.model('Session', sessionSchema)
