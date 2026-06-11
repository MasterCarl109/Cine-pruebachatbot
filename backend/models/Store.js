const mongoose = require('mongoose')

const roomSchema = new mongoose.Schema({
    name: { type: String, required: true },
    capacity: { type: Number, required: true, min: 1 }
})

const storeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String },
    phone: { type: String },
    rooms: { type: [roomSchema], default: [] }
}, { timestamps: true })

module.exports = mongoose.model('Store', storeSchema)
