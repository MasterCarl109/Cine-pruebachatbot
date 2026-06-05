require('dotenv').config()
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const connectDB = require('./config/db')
const chatHandler = require('./sockets/chatHandler')
const authRoutes = require('./routes/auth')
const movieRoutes = require('./routes/movies')
const directorRoutes = require('./routes/directors')
const genreRoutes = require('./routes/genres')
const storeRoutes = require('./routes/stores')
const userRoutes = require('./routes/users')
const reservationRoutes = require('./routes/reservations')
const { authenticate, requireRole } = require('./middleware/auth')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
})

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'CineClub API' })
})

app.use('/api/auth', authRoutes)

app.use('/api/movies', movieRoutes)
app.use('/api/directors', directorRoutes)
app.use('/api/genres', genreRoutes)
app.use('/api/stores', storeRoutes)

app.use('/api/users', authenticate, requireRole('admin'), userRoutes)
app.use('/api/reservations', reservationRoutes)

chatHandler(io)

const PORT = process.env.PORT || 3000

connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`)
        console.log(`WebSocket listo en ws://localhost:${PORT}`)
    })
})
