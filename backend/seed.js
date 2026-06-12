require('dotenv').config()
const mongoose = require('mongoose')
const Movie = require('./models/Movie')
const Director = require('./models/Director')
const Genre = require('./models/Genre')
const Store = require('./models/Store')
const User = require('./models/User')
const Client = require('./models/Client')
const Reservation = require('./models/Reservation')
const ChatSession = require('./models/ChatSession')

const directors = [
    { name: 'Alfred Hitchcock', nationality: 'Británica', biography: 'Director británico conocido como el maestro del suspense.' },
    { name: 'Christopher Nolan', nationality: 'Británica', biography: 'Director conocido por películas complejas y blockbusters.' },
    { name: 'Greta Gerwig', nationality: 'Estadounidense', biography: 'Directora y actriz destacada del cine independiente.' },
    { name: 'Guillermo del Toro', nationality: 'Mexicana', biography: 'Director conocido por su estilo fantástico y oscuro.' },
    { name: 'Spike Lee', nationality: 'Estadounidense', biography: 'Director icónico del cine afroamericano.' }
]

const genres = [
    { name: 'Terror' },
    { name: 'Comedia' },
    { name: 'Drama' },
    { name: 'Ciencia Ficción' },
    { name: 'Suspenso' },
    { name: 'Acción' }
]

const stores = [
    {
        name: 'Centro', address: 'Av. Principal 123, Centro', phone: '555-1000',
        rooms: [
            { name: 'Sala 1', capacity: 8 },
            { name: 'Sala 2', capacity: 10 },
            { name: 'Sala 3', capacity: 10 },
            { name: 'Sala 4', capacity: 12 },
            { name: 'Sala 5', capacity: 8 }
        ]
    },
    {
        name: 'Norte', address: 'Calle Norte 456, Colonia del Valle', phone: '555-2000',
        rooms: [
            { name: 'Sala 1', capacity: 10 },
            { name: 'Sala 2', capacity: 8 },
            { name: 'Sala 3', capacity: 10 },
            { name: 'Sala 4', capacity: 12 },
            { name: 'Sala 5', capacity: 8 }
        ]
    },
    {
        name: 'Sur', address: 'Boulevard Sur 789, Colonia Jardín', phone: '555-3000',
        rooms: [
            { name: 'Sala 1', capacity: 10 },
            { name: 'Sala 2', capacity: 8 },
            { name: 'Sala 3', capacity: 10 },
            { name: 'Sala 4', capacity: 12 },
            { name: 'Sala 5', capacity: 8 }
        ]
    }
]

function daysFromNow(days) {
    const d = new Date()
    d.setDate(d.getDate() + days)
    d.setHours(0, 0, 0, 0)
    return d
}

function g(storeId, room, cap, dayOffsets, times) {
    const screenings = []
    for (const offset of dayOffsets) {
        const date = daysFromNow(offset)
        for (const time of times) {
            screenings.push({ store: storeId, room, date, time, totalSeats: cap, bookedSeats: 0 })
        }
    }
    return screenings
}

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log('Conectado a MongoDB')

        await Promise.all([
            Movie.deleteMany({}),
            Director.deleteMany({}),
            Genre.deleteMany({}),
            Store.deleteMany({}),
            User.deleteMany({}),
            Client.deleteMany({}),
            Reservation.deleteMany({}),
            ChatSession.deleteMany({})
        ])
        console.log('Colecciones limpiadas')

        const createdDirectors = await Director.insertMany(directors)
        const createdGenres = await Genre.insertMany(genres)
        const createdStores = await Store.insertMany(stores)

        const [hitchcock, nolan, gerwig, delToro, spikeLee] = createdDirectors
        const [terror, comedia, drama, sciFi, suspenso, accion] = createdGenres
        const [centro, norte, sur] = createdStores

        // Scheduling: each movie gets a dedicated room per store (no time conflicts)
        const movies = [
            {
                title: 'Psicosis', duration: 109, rating: 'R', price: 22,
                releaseDate: new Date('1960-09-08'),
                synopsis: 'Una secretaria huye con dinero robado y se encuentra con un misterioso motel.',
                director: hitchcock._id, genres: [terror._id, suspenso._id],
                screenings: [
                    ...g(centro._id, 'Sala 1', 8, [-10, -5, 0, 5, 10], ['16:00', '18:00', '20:00']),
                    ...g(norte._id, 'Sala 2', 8, [-10, -5, 0, 5], ['16:00', '20:00'])
                ]
            },
            {
                title: 'Los pájaros', duration: 119, rating: 'PG-13', price: 20,
                releaseDate: new Date('1963-03-28'),
                synopsis: 'Aves de todo tipo comienzan a atacar sin razón aparente a los habitantes de un pueblo.',
                director: hitchcock._id, genres: [terror._id, suspenso._id],
                screenings: [
                    ...g(sur._id, 'Sala 2', 8, [-30, -25, -20, -15], ['18:00', '20:00'])
                ]
            },
            {
                title: 'La ventana indiscreta', duration: 112, rating: 'PG', price: 18,
                releaseDate: new Date('1954-09-01'),
                synopsis: 'Un fotógrafo confinado a una silla de ruedas cree haber presenciado un asesinato.',
                director: hitchcock._id, genres: [suspenso._id, drama._id],
                screenings: [
                    ...g(sur._id, 'Sala 5', 8, [-5, 0], ['20:00'])
                ]
            },
            {
                title: 'Inception', duration: 148, rating: 'PG-13', price: 30,
                releaseDate: new Date('2010-07-16'),
                synopsis: 'Un ladrón especializado en extraer secretos del subconsciente a través de los sueños.',
                director: nolan._id, genres: [sciFi._id, accion._id, suspenso._id],
                offers: [
                    { store: centro._id, description: 'Combo jueves', discountPercent: 15, startDate: daysFromNow(-1), endDate: daysFromNow(30), active: true },
                    { store: sur._id, description: 'Combo jueves', discountPercent: 15, startDate: daysFromNow(-1), endDate: daysFromNow(30), active: true }
                ],
                screenings: [
                    ...g(centro._id, 'Sala 2', 10, [-3, 0, 3, 7, 10, 14], ['14:00', '16:00', '18:00', '20:00']),
                    ...g(norte._id, 'Sala 1', 10, [-3, 0, 3, 7, 10, 14], ['16:00', '18:00', '20:00']),
                    ...g(sur._id, 'Sala 1', 10, [-3, 0, 3, 7, 10, 14], ['16:00', '20:00'])
                ]
            },
            {
                title: 'Interestelar', duration: 169, rating: 'PG-13', price: 28,
                releaseDate: new Date('2014-11-07'),
                synopsis: 'Un equipo de exploradores viaja a través de un agujero de gusano en busca de un nuevo hogar para la humanidad.',
                director: nolan._id, genres: [sciFi._id, drama._id],
                screenings: [
                    ...g(sur._id, 'Sala 2', 8, [5, 10, 15, 20, 25], ['18:00', '20:00'])
                ]
            },
            {
                title: 'Lady Bird', duration: 94, rating: 'R', price: 20,
                releaseDate: new Date('2017-09-01'),
                synopsis: 'Una adolescente navega su último año de preparatoria y su relación con su madre.',
                director: gerwig._id, genres: [comedia._id, drama._id],
                offers: [
                    { store: norte._id, description: 'Lunes de independientes', discountPercent: 15, startDate: daysFromNow(-1), endDate: daysFromNow(30), active: true }
                ],
                screenings: [
                    ...g(norte._id, 'Sala 3', 10, [-5, -2, 0, 3, 7], ['16:00', '18:00', '20:00'])
                ]
            },
            {
                title: 'Barbie', duration: 114, rating: 'PG-13', price: 25,
                releaseDate: new Date('2023-07-21'),
                synopsis: 'Barbie y Ken viven en un mundo perfecto hasta que una crisis existencial los lleva al mundo real.',
                director: gerwig._id, genres: [comedia._id],
                offers: [
                    { store: centro._id, description: 'Oferta de verano', discountPercent: 20, startDate: daysFromNow(-1), endDate: daysFromNow(30), active: true },
                    { store: norte._id, description: 'Oferta de verano', discountPercent: 20, startDate: daysFromNow(-1), endDate: daysFromNow(30), active: true },
                    { store: sur._id, description: 'Oferta de verano', discountPercent: 20, startDate: daysFromNow(-1), endDate: daysFromNow(30), active: true }
                ],
                screenings: [
                    ...g(centro._id, 'Sala 3', 10, [30, 35, 40, 45], ['14:00', '16:00', '18:00', '20:00']),
                    ...g(norte._id, 'Sala 4', 12, [30, 35, 40], ['16:00', '18:00']),
                    ...g(sur._id, 'Sala 4', 12, [30, 35, 40], ['16:00', '20:00'])
                ]
            },
            {
                title: 'El laberinto del fauno', duration: 118, rating: 'R', price: 22,
                releaseDate: new Date('2006-10-11'),
                synopsis: 'En la España de 1944, una niña descubre un mundo mágico y misterioso.',
                director: delToro._id, genres: [drama._id, terror._id],
                screenings: [
                    ...g(centro._id, 'Sala 5', 8, [0, 3, 7, 10, 14], ['16:00', '18:00', '20:00']),
                    ...g(sur._id, 'Sala 3', 10, [0, 3, 7, 10, 14], ['16:00', '20:00'])
                ]
            },
            {
                title: 'La forma del agua', duration: 123, rating: 'R', price: 20,
                releaseDate: new Date('2017-12-01'),
                synopsis: 'Una conserje de un laboratorio secreto se enamora de una criatura anfibia.',
                director: delToro._id, genres: [drama._id],
                screenings: [
                    ...g(norte._id, 'Sala 5', 8, [-10, -7, -3], ['18:00', '20:00'])
                ]
            },
            {
                title: 'Haz lo correcto', duration: 120, rating: 'R', price: 18,
                releaseDate: new Date('1989-06-30'),
                synopsis: 'Un día de verano en un barrio de Brooklyn, las tensiones raciales alcanzan su punto crítico.',
                director: spikeLee._id, genres: [drama._id, comedia._id],
                offers: [
                    { store: centro._id, description: 'Clásico del mes', discountPercent: 50, startDate: daysFromNow(-1), endDate: daysFromNow(30), active: true }
                ],
                screenings: [
                    ...g(centro._id, 'Sala 4', 12, [0, 3, 7, 10], ['14:00', '16:00', '18:00', '20:00']),
                    ...g(norte._id, 'Sala 4', 12, [0, 3, 7, 10], ['16:00', '18:00'])
                ]
            }
        ]

        const createdMovies = await Movie.insertMany(movies)
        console.log('Películas insertadas')

        const users = await User.create([
            { email: 'admin@cineclub.com', password: 'admin123', name: 'Admin Principal', role: 'admin' },
            { email: 'manager.centro@cineclub.com', password: 'manager123', name: 'Carlos Gómez', role: 'manager', store: centro._id },
            { email: 'manager.sur@cineclub.com', password: 'manager123', name: 'María López', role: 'manager', store: sur._id },
            { email: 'empleado.norte@cineclub.com', password: 'empleado123', name: 'Pedro Ramírez', role: 'employee', store: norte._id }
        ])

        const clientUser = await Client.create({
            email: 'cliente@cineclub.com',
            password: 'cliente123',
            name: 'Ana Torres',
            virtualCard: { cardNumber: '4000123456789012', pin: '123456', balance: 100000 }
        })
        console.log('Usuarios creados:')
        console.log('  admin@cineclub.com / admin123 (admin)')
        console.log('  manager.centro@cineclub.com / manager123 (manager - Centro)')
        console.log('  manager.sur@cineclub.com / manager123 (manager - Sur)')
        console.log('  empleado.norte@cineclub.com / empleado123 (employee - Norte)')
        console.log('  cliente@cineclub.com / cliente123 / PIN 123456 / Tarjeta 4000123456789012 (client)')

        const [, mgrCentro, , empNorte] = users

        const inception = createdMovies.find(m => m.title === 'Inception')
        const hazLoCorrecto = createdMovies.find(m => m.title === 'Haz lo correcto')
        const psicosis = createdMovies.find(m => m.title === 'Psicosis')
        const ladyBird = createdMovies.find(m => m.title === 'Lady Bird')

        const today = daysFromNow(0)

        const calcPrice = (movie, storeId, ticketType) => {
            let price = movie.price
            const activeOffer = movie.offers?.find(o =>
                o.active &&
                (!o.store || String(o.store) === String(storeId)) &&
                o.startDate <= new Date() && o.endDate >= new Date()
            )
            if (activeOffer) price = price - (price * activeOffer.discountPercent / 100)
            if (ticketType === 'child') price = price - (price * 0.30)
            return Math.round(price)
        }

        await Reservation.create([
            {
                movie: inception._id, client: clientUser._id, createdBy: mgrCentro._id,
                store: centro._id, room: 'Sala 2',
                screeningDate: today, showtime: '18:00', seatNumber: 1, ticketType: 'adult',
                amount: calcPrice(inception, centro._id, 'adult'), paymentStatus: 'paid', status: 'active'
            },
            {
                movie: inception._id, client: clientUser._id, createdBy: mgrCentro._id,
                store: centro._id, room: 'Sala 2',
                screeningDate: today, showtime: '18:00', seatNumber: 2, ticketType: 'child',
                amount: calcPrice(inception, centro._id, 'child'), paymentStatus: 'paid', status: 'active'
            },
            {
                movie: hazLoCorrecto._id, client: clientUser._id, createdBy: mgrCentro._id,
                store: centro._id, room: 'Sala 4',
                screeningDate: today, showtime: '16:00', seatNumber: 3, ticketType: 'adult',
                amount: calcPrice(hazLoCorrecto, centro._id, 'adult'), paymentStatus: 'paid', status: 'active'
            },
            {
                movie: psicosis._id, client: clientUser._id, createdBy: mgrCentro._id,
                store: centro._id, room: 'Sala 1',
                screeningDate: today, showtime: '20:00', seatNumber: 5, ticketType: 'adult',
                amount: calcPrice(psicosis, centro._id, 'adult'), paymentStatus: 'paid', status: 'active'
            },
            {
                movie: ladyBird._id, client: clientUser._id, createdBy: empNorte._id,
                store: norte._id, room: 'Sala 3',
                screeningDate: today, showtime: '18:00', seatNumber: 1, ticketType: 'adult',
                amount: calcPrice(ladyBird, norte._id, 'adult'), paymentStatus: 'refunded', status: 'cancelled'
            }
        ])
        console.log('Reservas de muestra creadas')

        const updateBookedSeats = async (movie, storeId, room, date, time, inc) => {
            await Movie.findOneAndUpdate(
                { _id: movie._id, 'screenings.store': storeId, 'screenings.room': room, 'screenings.date': date, 'screenings.time': time },
                { $inc: { 'screenings.$[s].bookedSeats': inc } },
                { arrayFilters: [{ 's.store': storeId, 's.room': room, 's.date': date, 's.time': time }] }
            )
        }

        await updateBookedSeats(inception, centro._id, 'Sala 2', today, '18:00', 2)
        await updateBookedSeats(hazLoCorrecto, centro._id, 'Sala 4', today, '16:00', 1)
        await updateBookedSeats(psicosis, centro._id, 'Sala 1', today, '20:00', 1)
        console.log('Asientos actualizados en screenings')

        const paidReservations = await Reservation.find({ client: clientUser._id, paymentStatus: 'paid' })
        const totalSpent = paidReservations.reduce((sum, r) => sum + r.amount, 0)
        await Client.findByIdAndUpdate(clientUser._id, { $inc: { 'virtualCard.balance': -totalSpent } })
        console.log(`Saldo del cliente actualizado: -${totalSpent}`)

        console.log('Seed completado exitosamente')
        process.exit(0)
    } catch (error) {
        console.error('Error en seed:', error.message)
        console.error(error)
        process.exit(1)
    }
}

seed()