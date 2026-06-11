const express = require('express')
const router = express.Router()
const ChatSession = require('../models/ChatSession')
const { authenticate, requireRole } = require('../middleware/auth')

router.get('/', authenticate, requireRole('admin', 'manager'), async (req, res) => {
    try {
        const filter = { status: { $in: ['waiting', 'active'] } }
        if (req.user.role === 'manager') {
            filter.store = req.user.store
        }
        const sessions = await ChatSession.find(filter)
            .populate('client', 'name email')
            .populate('manager', 'name email')
            .populate('store', 'name')
            .sort({ createdAt: -1 })
            .lean()
        res.json(sessions)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

router.get('/history', authenticate, requireRole('admin', 'manager'), async (req, res) => {
    try {
        const filter = { status: 'closed' }
        if (req.user.role === 'manager') {
            filter.store = req.user.store
        }
        const sessions = await ChatSession.find(filter)
            .populate('client', 'name email')
            .populate('manager', 'name email')
            .populate('store', 'name')
            .sort({ updatedAt: -1 })
            .limit(50)
            .lean()
        res.json(sessions)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

router.get('/:id', authenticate, requireRole('admin', 'manager'), async (req, res) => {
    try {
        const session = await ChatSession.findById(req.params.id)
            .populate('client', 'name email')
            .populate('manager', 'name email')
            .populate('store', 'name')
            .lean()
        if (!session) return res.status(404).json({ error: 'Sesión no encontrada' })
        if (req.user.role === 'manager' && session.store && String(session.store._id) !== String(req.user.store)) {
            return res.status(403).json({ error: 'No tienes acceso a esta sesión' })
        }
        res.json(session)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

module.exports = router
