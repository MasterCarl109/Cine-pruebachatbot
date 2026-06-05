const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const clientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    active: { type: Boolean, default: true }
}, { timestamps: true })

clientSchema.pre('save', async function () {
    if (!this.isModified('password')) return
    this.password = await bcrypt.hash(this.password, 12)
})

clientSchema.methods.comparePassword = async function (candidate) {
    return bcrypt.compare(candidate, this.password)
}

module.exports = mongoose.model('Client', clientSchema)
