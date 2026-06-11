import { useState, useEffect, useCallback } from 'react'
import { Container, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, InputLabel, FormControl, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Box } from '@mui/material'
import { getMovies, getMovie, createMovie, updateMovie, deleteMovie, getDirectors, getGenres, getStores } from '../services/api'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import OffersManager from '../components/admin/OffersManager'

const emptyForm = { title: '', releaseDate: '', synopsis: '', duration: '', rating: 'PG-13', director: '', genres: [] }

function getMovieStatus(movie) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const active = movie.screenings?.some(s => {
    const d = new Date(s.date)
    d.setHours(0, 0, 0, 0)
    return d >= today
  })
  if (active) return { label: 'En cartelera', color: 'success' }
  return { label: 'Archivada', color: 'default' }
}

export default function AdminMovies() {
  const [movies, setMovies] = useState([])
  const [directors, setDirectors] = useState([])
  const [genres, setGenres] = useState([])
  const [stores, setStores] = useState([])
  const [dialog, setDialog] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [screenings, setScreenings] = useState([])
  const [movieData, setMovieData] = useState(null)

  const fetchMovieOffers = useCallback(async (id) => {
    if (!id) return
    const { data } = await getMovie(id)
    setMovieData(data)
  }, [])

  const fetchData = useCallback(async () => {
    const [m, d, g, s] = await Promise.all([
      getMovies({ all: 'true' }), getDirectors(), getGenres(), getStores()
    ])
    setMovies(m.data)
    setDirectors(d.data)
    setGenres(g.data)
    setStores(s.data)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSave = async () => {
    const payload = {
      ...form,
      releaseDate: form.releaseDate ? new Date(form.releaseDate) : undefined,
      duration: Number(form.duration),
      screenings: screenings.filter(s => s.date && s.time)
    }
    if (editing) {
      await updateMovie(editing, payload)
    } else {
      await createMovie(payload)
    }
    setDialog(false)
    setEditing(null)
    setForm(emptyForm)
    setScreenings([])
    setMovieData(null)
    fetchData()
  }

  const openEdit = (movie) => {
    setForm({
      title: movie.title,
      releaseDate: movie.releaseDate ? movie.releaseDate.slice(0, 10) : '',
      synopsis: movie.synopsis || '',
      duration: String(movie.duration || ''),
      rating: movie.rating || 'PG-13',
      director: movie.director?._id || '',
      genres: movie.genres?.map(g => g._id) || []
    })
    setScreenings(movie.screenings?.map(s => ({
      store: s.store?._id || s.store,
      room: s.room || '',
      date: s.date ? s.date.slice(0, 10) : '',
      time: s.time || '',
      totalSeats: s.totalSeats || 10,
      bookedSeats: s.bookedSeats || 0
    })) || [])
    setEditing(movie._id)
    setMovieData(movie)
    setDialog(true)
    fetchMovieOffers(movie._id)
  }

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar esta película?')) {
      await deleteMovie(id)
      fetchData()
    }
  }

  const updateScreening = (idx, field, value) => {
    setScreenings(prev => prev.map((s, i) => {
      if (i !== idx) return s
      const updated = { ...s, [field]: value }
      if (field === 'room') {
        const store = stores.find(st => st._id === s.store)
        const room = store?.rooms?.find(r => r._id === value || r.name === value)
        if (room) updated.totalSeats = room.capacity
      }
      return updated
    }))
  }

  const addScreening = (storeId) => {
    setScreenings(prev => [...prev, { store: storeId, room: '', date: '', time: '', totalSeats: 10 }])
  }

  const removeScreening = (idx) => {
    setScreenings(prev => prev.filter((_, i) => i !== idx))
  }

  const getStoreScreenings = (storeId) => {
    return screenings.filter(s => s.store === storeId)
  }

  const times = ['14:00', '16:00', '18:00', '20:00', '22:00']

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Películas</Typography>
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setForm(emptyForm); setScreenings([]); setDialog(true) }} sx={{ mb: 2 }}>
        Nueva película
      </Button>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Título</TableCell><TableCell>Director</TableCell><TableCell>Géneros</TableCell><TableCell>Estado</TableCell><TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {movies.map((m) => {
              const status = getMovieStatus(m)
              return (
                <TableRow key={m._id}>
                  <TableCell>{m.title}</TableCell>
                  <TableCell>{m.director?.name}</TableCell>
                  <TableCell>{m.genres?.map(g => g.name).join(', ')}</TableCell>
                  <TableCell><Chip label={status.label} color={status.color} size="small" /></TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => openEdit(m)}><EditIcon /></IconButton>
                    <IconButton onClick={() => handleDelete(m._id)} color="error"><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Editar película' : 'Nueva película'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} margin="dense" required />
          <TextField fullWidth label="Fecha de estreno" type="date" value={form.releaseDate} onChange={(e) => setForm({ ...form, releaseDate: e.target.value })} margin="dense" slotProps={{ inputLabel: { shrink: form.releaseDate ? true : undefined } }} />
          <TextField fullWidth label="Sinopsis" value={form.synopsis} onChange={(e) => setForm({ ...form, synopsis: e.target.value })} margin="dense" multiline rows={3} />
          <TextField fullWidth label="Duración (min)" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} margin="dense" type="number" />
          <FormControl fullWidth margin="dense">
            <InputLabel>Clasificación</InputLabel>
            <Select value={form.rating} label="Clasificación" onChange={(e) => setForm({ ...form, rating: e.target.value })}>
              {['G', 'PG', 'PG-13', 'R', 'NC-17'].map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Director</InputLabel>
            <Select value={form.director} label="Director" onChange={(e) => setForm({ ...form, director: e.target.value })}>
              {directors.map((d) => <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Géneros</InputLabel>
            <Select multiple value={form.genres} label="Géneros" onChange={(e) => setForm({ ...form, genres: e.target.value })} renderValue={(selected) => selected.map(id => genres.find(g => g._id === id)?.name).join(', ')}>
              {genres.map((g) => <MenuItem key={g._id} value={g._id}>{g.name}</MenuItem>)}
            </Select>
          </FormControl>

          <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>Funciones (Screenings)</Typography>
          {stores.map((store) => {
            const storeScreenings = getStoreScreenings(store._id)
            return (
              <Box key={store._id} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>{store.name}</Typography>
                {storeScreenings.map((s, idx) => {
                  const globalIdx = screenings.indexOf(s)
                  return (
                    <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                      <TextField size="small" type="date" label="Fecha" value={s.date} onChange={(e) => updateScreening(globalIdx, 'date', e.target.value)} slotProps={{ inputLabel: { shrink: s.date ? true : undefined } }} sx={{ width: 160 }} />
                      <FormControl size="small" sx={{ width: 100 }}>
                        <InputLabel>Hora</InputLabel>
                        <Select value={s.time} label="Hora" onChange={(e) => updateScreening(globalIdx, 'time', e.target.value)}>
                          {times.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                        </Select>
                      </FormControl>
                      <FormControl size="small" sx={{ width: 120 }}>
                        <InputLabel>Sala</InputLabel>
                        <Select value={s.room} label="Sala" onChange={(e) => updateScreening(globalIdx, 'room', e.target.value)}>
                          {(store.rooms || []).map((r) => <MenuItem key={r._id} value={r.name}>{r.name} ({r.capacity} asientos)</MenuItem>)}
                        </Select>
                      </FormControl>
                      <TextField size="small" type="number" label="Asientos" value={s.totalSeats} onChange={(e) => updateScreening(globalIdx, 'totalSeats', Number(e.target.value))} sx={{ width: 100 }} />
                      <IconButton size="small" color="error" onClick={() => removeScreening(globalIdx)}><DeleteIcon /></IconButton>
                    </Box>
                  )
                })}
                <Button size="small" variant="outlined" onClick={() => addScreening(store._id)} startIcon={<AddIcon />}>
                  Agregar función
                </Button>
              </Box>
            )
          })}

          {movieData && (
            <OffersManager movie={movieData} stores={stores} onUpdate={() => fetchMovieOffers(editing)} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>{editing ? 'Guardar' : 'Crear'}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
