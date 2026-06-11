import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('user')
    }
    return Promise.reject(err)
  }
)

export const login = (email, password) => api.post('/auth/login', { email, password })
export const staffLogout = () => api.post('/auth/logout')
export const getStaffSocketToken = () => api.get('/auth/socket-token')
export const getStaffMe = () => api.get('/auth/me')
export const clientLogin = (email, password) => api.post('/client-auth/login', { email, password })
export const clientLogout = () => api.post('/client-auth/logout')
export const clientRegister = (email, password, name, pin) => api.post('/client-auth/register', { email, password, name, pin })
export const getClientSocketToken = () => api.get('/client-auth/socket-token')
export const getClientProfile = () => api.get('/client-auth/me')
export const searchClient = (email) => api.get('/client-auth/search', { params: { email } })

export const getMovies = (params) => api.get('/movies', { params })
export const getMovie = (id) => api.get(`/movies/${id}`)
export const createMovie = (data) => api.post('/movies', data)
export const updateMovie = (id, data) => api.put(`/movies/${id}`, data)
export const deleteMovie = (id) => api.delete(`/movies/${id}`)
export const addOffer = (movieId, data) => api.post(`/movies/${movieId}/offers`, data)
export const updateOffer = (movieId, idx, data) => api.put(`/movies/${movieId}/offers/${idx}`, data)
export const deleteOffer = (movieId, idx) => api.delete(`/movies/${movieId}/offers/${idx}`)

export const getDirectors = (params) => api.get('/directors', { params })
export const getDirector = (id) => api.get(`/directors/${id}`)
export const createDirector = (data) => api.post('/directors', data)
export const updateDirector = (id, data) => api.put(`/directors/${id}`, data)
export const deleteDirector = (id) => api.delete(`/directors/${id}`)

export const getGenres = () => api.get('/genres')
export const createGenre = (data) => api.post('/genres', data)
export const updateGenre = (id, data) => api.put(`/genres/${id}`, data)
export const deleteGenre = (id) => api.delete(`/genres/${id}`)

export const getStores = () => api.get('/stores')
export const createStore = (data) => api.post('/stores', data)
export const updateStore = (id, data) => api.put(`/stores/${id}`, data)
export const deleteStore = (id) => api.delete(`/stores/${id}`)
export const getRooms = (storeId) => api.get(`/stores/${storeId}/rooms`)
export const addRoom = (storeId, data) => api.post(`/stores/${storeId}/rooms`, data)
export const updateRoom = (storeId, roomId, data) => api.put(`/stores/${storeId}/rooms/${roomId}`, data)
export const deleteRoom = (storeId, roomId) => api.delete(`/stores/${storeId}/rooms/${roomId}`)

export const getUsers = () => api.get('/users')
export const getUser = (id) => api.get(`/users/${id}`)
export const createUser = (data) => api.post('/users', data)
export const updateUser = (id, data) => api.put(`/users/${id}`, data)
export const deleteUser = (id) => api.delete(`/users/${id}`)

export const getReservations = (params) => api.get('/reservations', { params })
export const getMyReservations = () => api.get('/reservations/mine')
export const createReservation = (data) => api.post('/reservations', data)
export const cancelReservation = (id) => api.put(`/reservations/${id}/cancel`)
export const checkSeat = (params) => api.get('/reservations/check-seat', { params })
export const clientReserve = (data) => api.post('/reservations/client-reserve', data)
export const clientCancelReservation = (id) => api.put(`/reservations/${id}/client-cancel`)

export const getChatSessions = () => api.get('/chats')
export const getChatSession = (id) => api.get(`/chats/${id}`)
export const getChatHistory = () => api.get('/chats/history')

export default api
