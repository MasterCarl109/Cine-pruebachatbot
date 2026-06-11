require('dotenv').config()
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')
const mongoose = require('mongoose')
const connectDB = require('./config/db')
const Session = require('./models/Session')
const chatHandler = require('./sockets/chatHandler')
const authRoutes = require('./routes/auth')
const clientAuthRoutes = require('./routes/clientAuth')
const movieRoutes = require('./routes/movies')
const directorRoutes = require('./routes/directors')
const genreRoutes = require('./routes/genres')
const storeRoutes = require('./routes/stores')
const userRoutes = require('./routes/users')
const reservationRoutes = require('./routes/reservations')
const chatRoutes = require('./routes/chats')
const { authenticate, requireRole } = require('./middleware/auth')

const app = express()
const server = http.createServer(app)
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:5174']

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    }
})

app.use(helmet())
app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'CineClub API' })
})

app.use('/api/auth', authRoutes)
app.use('/api/client-auth', clientAuthRoutes)

app.use('/api/movies', movieRoutes)
app.use('/api/directors', directorRoutes)
app.use('/api/genres', genreRoutes)
app.use('/api/stores', storeRoutes)

app.use('/api/users', authenticate, requireRole('admin'), userRoutes)
app.use('/api/reservations', reservationRoutes)
app.use('/api/chats', chatRoutes)

io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) {
        socket.isAnonymous = true
        return next()
    }
    try {
        const session = await Session.findOne({ token }).lean()
        if (!session || session.expiresAt < new Date()) {
            return next(new Error('Sesión inválida o expirada'))
        }
        socket.user = session.user
        next()
    } catch (err) {
        next(new Error('Error de autenticación'))
    }
})

chatHandler(io)

const PORT = process.env.PORT || 3000

app.use((err, req, res, next) => {
    console.error('Error no controlado:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
})

function gracefulShutdown(signal) {
    console.log(`\n${signal} recibido. Cerrando servidor...`)
    server.close(() => {
        mongoose.connection.close(false).then(() => {
            console.log('Conexiones cerradas.')
            process.exit(0)
        })
    })
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`)
        console.log(`WebSocket listo en ws://localhost:${PORT}`)
    })
})
