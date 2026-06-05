import { useState, useEffect, useCallback } from 'react'
import { Container, Typography, Button, Box, Tabs, Tab, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Alert, CircularProgress, Chip, Snackbar, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { getMovies, getReservations, createReservation, cancelReservation, searchClient } from '../services/api'
import { useAuth } from '../context/AuthContext'

function SeatMap({ totalSeats, bookedSeats, selectedSeat, onSelect }) {
  const seats = Array.from({ length: totalSeats }, (_, i) => i + 1)
  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
      {seats.map(num => {
        const booked = bookedSeats.includes(num)
        const selected = selectedSeat === num
        return (
          <Box
            key={num}
            onClick={() => !booked && onSelect(selected ? null : num)}
            sx={{
              width: 48, height: 48, display: 'flex', alignItems: 'center',
              justifyContent: 'center', borderRadius: 1,
              cursor: booked ? 'not-allowed' : 'pointer',
              bgcolor: selected ? 'primary.main' : booked ? 'error.main' : 'grey.300',
              color: selected || booked ? 'white' : 'text.primary',
              fontWeight: 'bold', fontSize: '0.9rem',
              border: selected ? 2 : 0, borderColor: 'primary.dark',
              '&:hover': booked ? {} : { opacity: 0.8 }
            }}
          >
            {num}
          </Box>
        )
      })}
    </Box>
  )
}

export default function EmployeePanel() {
  const { user } = useAuth()
  const storeId = user?.store?._id || user?.store
  const storeName = user?.store?.name || 'Mi Tienda'

  const [tab, setTab] = useState(0)

  // --- Inventario ---
  const [movies, setMovies] = useState([])

  // --- Nueva Reserva ---
  const [clientEmail, setClientEmail] = useState('')
  const [foundClient, setFoundClient] = useState(null)
  const [searchingClient, setSearchingClient] = useState(false)
  const [selectedMovieId, setSelectedMovieId] = useState('')
  const [selectedScreeningKey, setSelectedScreeningKey] = useState('')
  const [selectedSeat, setSelectedSeat] = useState(null)
  const [bookedSeats, setBookedSeats] = useState([])
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // --- Listado de reservas ---
  const [reservations, setReservations] = useState([])

  const fetchMovies = useCallback(async () => {
    const res = await getMovies()
    setMovies(res.data)
  }, [])

  useEffect(() => { fetchMovies() }, [fetchMovies])

  const filteredMovies = movies.filter(m =>
    m.screenings?.some(s => String(s.store?._id || s.store) === String(storeId))
  )

  // Obtener screenings de la tienda para la película seleccionada
  const selectedMovie = movies.find(m => m._id === selectedMovieId)
  const storeScreenings = selectedMovie?.screenings?.filter(
    s => String(s.store?._id || s.store) === String(storeId)
  ) || []

  // Encontrar screening seleccionado (date+time como key)
  const selectedScreening = storeScreenings.find(
    s => `${new Date(s.date).toISOString().split('T')[0]}-${s.time}` === selectedScreeningKey
  ) || null

  const handleSearchClient = async () => {
    if (!clientEmail.trim()) return
    setSearchingClient(true)
    setFoundClient(null)
    setError('')
    try {
      const { data } = await searchClient(clientEmail.trim())
      setFoundClient(data)
    } catch (err) {
      setError(err.response?.data?.error || 'Cliente no encontrado')
    } finally {
      setSearchingClient(false)
    }
  }

  const fetchBookedSeats = useCallback(async () => {
    if (!selectedMovieId || !selectedScreening) return
    const dateStr = new Date(selectedScreening.date).toISOString().split('T')[0]
    try {
      const res = await getReservations({ movieId: selectedMovieId, screeningDate: dateStr, status: 'active' })
      setBookedSeats(res.data.filter(r => r.showtime === selectedScreening.time).map(r => r.seatNumber))
    } catch (err) {
      console.error('Error al obtener asientos reservados:', err)
    }
  }, [selectedMovieId, selectedScreening])

  useEffect(() => { fetchBookedSeats() }, [fetchBookedSeats])

  const fetchReservations = useCallback(async () => {
    try {
      const res = await getReservations({})
      setReservations(res.data)
    } catch (err) {
      console.error('Error al obtener reservas:', err)
    }
  }, [])

  useEffect(() => {
    if (tab === 1) fetchReservations()
  }, [tab, fetchReservations])

  const handleCreateReservation = async () => {
    if (!foundClient || !selectedMovieId || !selectedScreening || !selectedSeat) {
      setError('Completa todos los campos')
      return
    }
    setCreating(true)
    setError('')
    try {
      const dateStr = new Date(selectedScreening.date).toISOString().split('T')[0]
      await createReservation({
        movieId: selectedMovieId,
        clientEmail: foundClient.email,
        screeningDate: dateStr,
        showtime: selectedScreening.time,
        seatNumber: selectedSeat
      })
      setSuccess(`Reserva creada: Asiento ${selectedSeat} para ${foundClient.name}`)
      setSelectedSeat(null)
      setFoundClient(null)
      setClientEmail('')
      setSelectedScreeningKey('')
      setBookedSeats([])
      fetchReservations()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear reserva')
    } finally {
      setCreating(false)
    }
  }

  const handleCancel = async (reservationId) => {
    try {
      await cancelReservation(reservationId)
      setSuccess('Reserva cancelada')
      fetchReservations()
    } catch (err) {
      setError('Error al cancelar reserva')
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mb: 1 }}>
        <Typography variant="h4">Mi Tienda</Typography>
        <Chip label={storeName} color="primary" size="small" />
      </Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Bienvenido, {user?.name}
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Inventario" />
        <Tab label="Reservas" />
      </Tabs>

      <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess('')}>
        <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>
      </Snackbar>

      {/* ============ INVENTARIO ============ */}
      {tab === 0 && (
        <>
          {filteredMovies.length === 0 ? (
            <Typography variant="body1" color="text.secondary">
              No hay películas activas en tu tienda en este momento.
            </Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Película</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Hora</TableCell>
                    <TableCell>Asientos</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredMovies.map((m) => {
                    const myScreenings = m.screenings?.filter(
                      s => String(s.store?._id || s.store) === String(storeId)
                    ) || []
                    return myScreenings.map((s, idx) => (
                      <TableRow key={`${m._id}-${idx}`}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">{m.title}</Typography>
                          <Typography variant="caption" color="text.secondary">{m.director?.name}</Typography>
                        </TableCell>
                        <TableCell>
                          {new Date(s.date).toLocaleDateString('es-MX')}
                        </TableCell>
                        <TableCell>{s.time}</TableCell>
                        <TableCell>
                          {s.totalSeats - s.bookedSeats}/{s.totalSeats} libres
                        </TableCell>
                      </TableRow>
                    ))
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* ============ RESERVAS ============ */}
      {tab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

          {/* --- Nueva Reserva --- */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Nueva Reserva</Typography>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end', mb: 2 }}>
              <TextField
                label="Email del cliente" size="small"
                value={clientEmail}
                onChange={e => setClientEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearchClient()}
              />
              <Button variant="contained" onClick={handleSearchClient} disabled={searchingClient}>
                {searchingClient ? <CircularProgress size={20} /> : 'Buscar'}
              </Button>
            </Box>

            {foundClient && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Cliente: {foundClient.name} ({foundClient.email})
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 250 }}>
                <InputLabel>Película</InputLabel>
                <Select
                  value={selectedMovieId}
                  label="Película"
                  onChange={e => { setSelectedMovieId(e.target.value); setSelectedScreeningKey(''); setSelectedSeat(null) }}
                >
                  <MenuItem value="">Seleccionar...</MenuItem>
                  {filteredMovies.map(m => (
                    <MenuItem key={m._id} value={m._id}>{m.title}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {storeScreenings.length > 0 && (
                <FormControl size="small" sx={{ minWidth: 280 }}>
                  <InputLabel>Función</InputLabel>
                  <Select
                    value={selectedScreeningKey}
                    label="Función"
                    onChange={e => { setSelectedScreeningKey(e.target.value); setSelectedSeat(null) }}
                  >
                    <MenuItem value="">Seleccionar...</MenuItem>
                    {storeScreenings.map((s, idx) => {
                      const key = `${new Date(s.date).toISOString().split('T')[0]}-${s.time}`
                      const free = s.totalSeats - s.bookedSeats
                      return (
                        <MenuItem key={idx} value={key}>
                          {new Date(s.date).toLocaleDateString('es-MX')} - {s.time} ({free}/{s.totalSeats} libres)
                        </MenuItem>
                      )
                    })}
                  </Select>
                </FormControl>
              )}
            </Box>

            {selectedScreening && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 2 }}>
                  Selecciona un asiento:
                </Typography>
                <SeatMap
                  totalSeats={selectedScreening.totalSeats}
                  bookedSeats={bookedSeats}
                  selectedSeat={selectedSeat}
                  onSelect={setSelectedSeat}
                />
                {selectedSeat && (
                  <Button
                    variant="contained" color="primary" sx={{ mt: 2 }}
                    disabled={creating}
                    onClick={handleCreateReservation}
                  >
                    {creating ? <CircularProgress size={20} /> : `Confirmar Reserva - Asiento ${selectedSeat}`}
                  </Button>
                )}
              </>
            )}
          </Paper>

          {/* --- Listado de Reservas --- */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Reservas de la Tienda</Typography>
            {reservations.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No hay reservas</Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Película</TableCell>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Horario</TableCell>
                      <TableCell>Asiento</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Acción</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reservations.map(r => (
                      <TableRow key={r._id}>
                        <TableCell>{r.movie?.title}</TableCell>
                        <TableCell>{r.client?.name}</TableCell>
                        <TableCell>{new Date(r.screeningDate).toLocaleDateString('es-MX')}</TableCell>
                        <TableCell>{r.showtime}</TableCell>
                        <TableCell>{r.seatNumber}</TableCell>
                        <TableCell>
                          <Chip
                            label={r.status === 'active' ? 'Activa' : 'Cancelada'}
                            color={r.status === 'active' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {r.status === 'active' && (
                            <Button size="small" color="error" onClick={() => handleCancel(r._id)}>
                              Cancelar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Box>
      )}
    </Container>
  )
}
