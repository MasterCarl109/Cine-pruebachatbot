const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const virtualCardSchema = new mongoose.Schema({
    cardNumber: { type: String, required: true, unique: true },
    pin: { type: String, required: true },
    balance: { type: Number, default: 100000 }
}, { _id: false })

const clientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    active: { type: Boolean, default: true },
    virtualCard: { type: virtualCardSchema, required: true }
}, { timestamps: true })

clientSchema.pre('save', async function () {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 12)
    }
    if (this.isModified('virtualCard.pin')) {
        this.virtualCard.pin = await bcrypt.hash(this.virtualCard.pin, 12)
    }
})

clientSchema.methods.comparePassword = async function (candidate) {
    return bcrypt.compare(candidate, this.password)
}

clientSchema.methods.comparePin = async function (candidatePin) {
    return bcrypt.compare(candidatePin, this.virtualCard.pin)
}

module.exports = mongoose.model('Client', clientSchema)
