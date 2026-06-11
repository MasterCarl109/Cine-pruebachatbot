const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
    from: { type: String, enum: ['client', 'manager', 'system'], required: true },
    text: { type: String, required: true }
}, { timestamps: true })

const chatSessionSchema = new mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', default: null },
    status: { type: String, enum: ['waiting', 'active', 'closed'], default: 'waiting' },
    messages: [messageSchema]
}, { timestamps: true })

module.exports = mongoose.model('ChatSession', chatSessionSchema)
