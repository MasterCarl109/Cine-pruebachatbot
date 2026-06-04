import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) localStorage.removeItem('token')
    return Promise.reject(err)
  }
)

export const login = (email, password) => api.post('/auth/login', { email, password })
export const register = (email, password, name) => api.post('/auth/register', { email, password, name })

export const getMovies = (params) => api.get('/movies', { params })
export const getMovie = (id) => api.get(`/movies/${id}`)
export const createMovie = (data) => api.post('/movies', data)
export const updateMovie = (id, data) => api.put(`/movies/${id}`, data)
export const deleteMovie = (id) => api.delete(`/movies/${id}`)

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

export const getUsers = () => api.get('/users')
export const getUser = (id) => api.get(`/users/${id}`)
export const createUser = (data) => api.post('/users', data)
export const updateUser = (id, data) => api.put(`/users/${id}`, data)
export const deleteUser = (id) => api.delete(`/users/${id}`)

export default api
