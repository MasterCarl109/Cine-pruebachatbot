const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    name: { type: String },
    role: { type: String, enum: ['admin', 'manager', 'employee'], required: true },
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', default: null },
    active: { type: Boolean, default: true }
}, { timestamps: true })

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return
    this.password = await bcrypt.hash(this.password, 12)
})

userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password)
}

module.exports = mongoose.model('User', userSchema)
