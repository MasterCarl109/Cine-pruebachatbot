require('dotenv').config()
const mongoose = require('mongoose')
const Movie = require('./models/Movie')
const Director = require('./models/Director')
const Genre = require('./models/Genre')
const Store = require('./models/Store')
const User = require('./models/User')
const Client = require('./models/Client')

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
    { name: 'Centro', address: 'Av. Principal 123, Centro', phone: '555-1000' },
    { name: 'Norte', address: 'Calle Norte 456, Colonia del Valle', phone: '555-2000' },
    { name: 'Sur', address: 'Boulevard Sur 789, Colonia Jardín', phone: '555-3000' }
]

function daysFromNow(days) {
    const d = new Date()
    d.setDate(d.getDate() + days)
    d.setHours(0, 0, 0, 0)
    return d
}

const generateScreenings = (storeId, dayOffsets, times) => {
    const screenings = []
    for (const offset of dayOffsets) {
        const date = daysFromNow(offset)
        for (const time of times) {
            screenings.push({ store: storeId, date, time, totalSeats: 10, bookedSeats: 0 })
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
            Client.deleteMany({})
        ])
        console.log('Colecciones limpiadas')

        const createdDirectors = await Director.insertMany(directors)
        const createdGenres = await Genre.insertMany(genres)
        const createdStores = await Store.insertMany(stores)

        const [hitchcock, nolan, gerwig, delToro, spikeLee] = createdDirectors
        const [terror, comedia, drama, sciFi, suspenso, accion] = createdGenres
        const [centro, norte, sur] = createdStores

        const movies = [
            {
                title: 'Psicosis',
                releaseDate: new Date('1960-09-08'),
                synopsis: 'Una secretaria huye con dinero robado y se encuentra con un misterioso motel.',
                duration: 109,
                rating: 'R',
                director: hitchcock._id,
                genres: [terror._id, suspenso._id],
                screenings: [
                    ...generateScreenings(centro._id, [-10, -5, 0, 5, 10], ['16:00', '18:00', '20:00']),
                    ...generateScreenings(norte._id, [-10, -5, 0, 5], ['16:00', '20:00'])
                ]
            },
            {
                title: 'Los pájaros',
                releaseDate: new Date('1963-03-28'),
                synopsis: 'Aves de todo tipo comienzan a atacar sin razón aparente a los habitantes de un pueblo.',
                duration: 119,
                rating: 'PG-13',
                director: hitchcock._id,
                genres: [terror._id, suspenso._id],
                screenings: [
                    ...generateScreenings(centro._id, [-30, -25, -20, -15], ['18:00']),
                    ...generateScreenings(sur._id, [-30, -25, -20, -15], ['18:00', '20:00'])
                ]
            },
            {
                title: 'La ventana indiscreta',
                releaseDate: new Date('1954-09-01'),
                synopsis: 'Un fotógrafo confinado a una silla de ruedas cree haber presenciado un asesinato.',
                duration: 112,
                rating: 'PG',
                director: hitchcock._id,
                genres: [suspenso._id, drama._id],
                screenings: [
                    ...generateScreenings(norte._id, [-5, 0], ['16:00', '18:00']),
                    ...generateScreenings(sur._id, [-5, 0], ['20:00'])
                ]
            },
            {
                title: 'Inception',
                releaseDate: new Date('2010-07-16'),
                synopsis: 'Un ladrón especializado en extraer secretos del subconsciente a través de los sueños.',
                duration: 148,
                rating: 'PG-13',
                director: nolan._id,
                genres: [sciFi._id, accion._id, suspenso._id],
                screenings: [
                    ...generateScreenings(centro._id, [-3, 0, 3, 7, 10, 14], ['14:00', '16:00', '18:00', '20:00']),
                    ...generateScreenings(norte._id, [-3, 0, 3, 7, 10, 14], ['16:00', '18:00', '20:00']),
                    ...generateScreenings(sur._id, [-3, 0, 3, 7, 10, 14], ['16:00', '20:00'])
                ]
            },
            {
                title: 'Interestelar',
                releaseDate: new Date('2014-11-07'),
                synopsis: 'Un equipo de exploradores viaja a través de un agujero de gusano en busca de un nuevo hogar para la humanidad.',
                duration: 169,
                rating: 'PG-13',
                director: nolan._id,
                genres: [sciFi._id, drama._id],
                screenings: [
                    ...generateScreenings(centro._id, [5, 10, 15, 20, 25], ['16:00', '18:00', '20:00']),
                    ...generateScreenings(sur._id, [5, 10, 15, 20, 25], ['18:00', '20:00'])
                ]
            },
            {
                title: 'Lady Bird',
                releaseDate: new Date('2017-09-01'),
                synopsis: 'Una adolescente navega su último año de preparatoria y su relación con su madre.',
                duration: 94,
                rating: 'R',
                director: gerwig._id,
                genres: [comedia._id, drama._id],
                screenings: [
                    ...generateScreenings(norte._id, [-5, -2, 0, 3, 7], ['16:00', '18:00', '20:00'])
                ]
            },
            {
                title: 'Barbie',
                releaseDate: new Date('2023-07-21'),
                synopsis: 'Barbie y Ken viven en un mundo perfecto hasta que una crisis existencial los lleva al mundo real.',
                duration: 114,
                rating: 'PG-13',
                director: gerwig._id,
                genres: [comedia._id],
                screenings: [
                    ...generateScreenings(centro._id, [30, 35, 40, 45], ['14:00', '16:00', '18:00', '20:00']),
                    ...generateScreenings(norte._id, [30, 35, 40], ['16:00', '18:00']),
                    ...generateScreenings(sur._id, [30, 35, 40], ['16:00', '20:00'])
                ]
            },
            {
                title: 'El laberinto del fauno',
                releaseDate: new Date('2006-10-11'),
                synopsis: 'En la España de 1944, una niña descubre un mundo mágico y misterioso.',
                duration: 118,
                rating: 'R',
                director: delToro._id,
                genres: [drama._id, terror._id],
                screenings: [
                    ...generateScreenings(centro._id, [0, 3, 7, 10, 14], ['16:00', '18:00', '20:00']),
                    ...generateScreenings(sur._id, [0, 3, 7, 10, 14], ['16:00', '20:00'])
                ]
            },
            {
                title: 'La forma del agua',
                releaseDate: new Date('2017-12-01'),
                synopsis: 'Una conserje de un laboratorio secreto se enamora de una criatura anfibia.',
                duration: 123,
                rating: 'R',
                director: delToro._id,
                genres: [drama._id],
                screenings: [
                    ...generateScreenings(norte._id, [-10, -7, -3], ['18:00', '20:00'])
                ]
            },
            {
                title: 'Haz lo correcto',
                releaseDate: new Date('1989-06-30'),
                synopsis: 'Un día de verano en un barrio de Brooklyn, las tensiones raciales alcanzan su punto crítico.',
                duration: 120,
                rating: 'R',
                director: spikeLee._id,
                genres: [drama._id, comedia._id],
                screenings: [
                    ...generateScreenings(centro._id, [0, 3, 7, 10], ['14:00', '16:00', '18:00', '20:00']),
                    ...generateScreenings(norte._id, [0, 3, 7, 10], ['16:00', '18:00']),
                    ...generateScreenings(sur._id, [0, 3, 7, 10], ['18:00', '20:00'])
                ]
            }
        ]

        const createdMovies = await Movie.insertMany(movies)
        console.log('Películas insertadas')

        const [centroStore, norteStore, surStore] = createdStores

        const users = await User.create([
            { email: 'admin@cineclub.com', password: 'admin123', name: 'Admin Principal', role: 'admin' },
            { email: 'manager.centro@cineclub.com', password: 'manager123', name: 'Carlos Gómez', role: 'manager', store: centroStore._id },
            { email: 'manager.sur@cineclub.com', password: 'manager123', name: 'María López', role: 'manager', store: surStore._id },
            { email: 'empleado.norte@cineclub.com', password: 'empleado123', name: 'Pedro Ramírez', role: 'employee', store: norteStore._id }
        ])

        const clientUser = await Client.create({ email: 'cliente@cineclub.com', password: 'cliente123', name: 'Ana Torres' })
        console.log('Usuarios creados:')
        console.log('  admin@cineclub.com / admin123 (admin)')
        console.log('  manager.centro@cineclub.com / manager123 (manager - Centro)')
        console.log('  manager.sur@cineclub.com / manager123 (manager - Sur)')
        console.log('  empleado.norte@cineclub.com / empleado123 (employee - Norte)')

        const [adminUser, mgrCentro, mgrSur, empNorte] = users

        const Reservation = require('./models/Reservation')
        await Reservation.deleteMany({})

        const inception = createdMovies.find(m => m.title === 'Inception')
        const hazLoCorrecto = createdMovies.find(m => m.title === 'Haz lo correcto')
        const psicosis = createdMovies.find(m => m.title === 'Psicosis')
        const ladyBird = createdMovies.find(m => m.title === 'Lady Bird')

        const today = daysFromNow(0)

        await Reservation.create([
            {
                movie: inception._id, client: clientUser._id, createdBy: mgrCentro._id,
                store: centroStore._id, screeningDate: today, showtime: '18:00',
                seatNumber: 1, status: 'active'
            },
            {
                movie: inception._id, client: clientUser._id, createdBy: mgrCentro._id,
                store: centroStore._id, screeningDate: today, showtime: '18:00',
                seatNumber: 2, status: 'active'
            },
            {
                movie: hazLoCorrecto._id, client: clientUser._id, createdBy: mgrCentro._id,
                store: centroStore._id, screeningDate: today, showtime: '16:00',
                seatNumber: 3, status: 'active'
            },
            {
                movie: psicosis._id, client: clientUser._id, createdBy: mgrCentro._id,
                store: centroStore._id, screeningDate: today, showtime: '20:00',
                seatNumber: 5, status: 'active'
            },
            {
                movie: ladyBird._id, client: clientUser._id, createdBy: empNorte._id,
                store: norteStore._id, screeningDate: today, showtime: '18:00',
                seatNumber: 1, status: 'cancelled'
            }
        ])
        console.log('Reservas de muestra creadas')

        const updateBookedSeats = async (movie, store, date, time, inc) => {
            await Movie.findOneAndUpdate(
                { _id: movie._id, 'screenings.store': store._id, 'screenings.date': date, 'screenings.time': time },
                { $inc: { 'screenings.$[s].bookedSeats': inc } },
                { arrayFilters: [{ 's.store': store._id, 's.date': date, 's.time': time }] }
            )
        }

        await updateBookedSeats(inception, centroStore, today, '18:00', 2)
        await updateBookedSeats(hazLoCorrecto, centroStore, today, '16:00', 1)
        await updateBookedSeats(psicosis, centroStore, today, '20:00', 1)
        console.log('Asientos actualizados en screenings')

        console.log('Seed completado exitosamente')
        process.exit(0)
    } catch (error) {
        console.error('Error en seed:', error)
        process.exit(1)
    }
}

seed()
