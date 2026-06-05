import { useState, useEffect, useCallback } from 'react'
import { Container, Typography, Button, Box, Tabs, Tab, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Alert, CircularProgress, Chip, Snackbar } from '@mui/material'
import { getMovies, updateMovie, getReservations, createReservation, cancelReservation, getUsers } from '../services/api'
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
  const storeName = user?.store?.name || 'tu tienda'
  const storeId = user?.store?._id || user?.store

  const [tab, setTab] = useState(0)

  // --- Inventario ---
  const [movies, setMovies] = useState([])
  const [editCopies, setEditCopies] = useState({})

  // --- Nueva Reserva ---
  const [clientEmail, setClientEmail] = useState('')
  const [foundClient, setFoundClient] = useState(null)
  const [searchingClient, setSearchingClient] = useState(false)
  const [selectedMovieId, setSelectedMovieId] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedShowtime, setSelectedShowtime] = useState('')
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
    m.screenings?.some(s => s.store?.name === storeName)
  )

  const handleCopyChange = (movieId, screeningIdx, val) => {
    setEditCopies(prev => ({ ...prev, [`${movieId}-${screeningIdx}`]: val }))
  }

  const selectedMovie = movies.find(m => m._id === selectedMovieId)
  const selectedScreening = selectedMovie?.screenings?.find(
    s => s.store?.name === storeName || s.store === storeId
  ) || null

  const todayStr = new Date().toISOString().split('T')[0]

  const searchClient = async () => {
    if (!clientEmail.trim()) return
    setSearchingClient(true)
    setFoundClient(null)
    setError('')
    try {
      const res = await getUsers()
      const client = res.data.find(u =>
        u.email === clientEmail.trim() && u.role === 'client' && u.active !== false
      )
      if (client) {
        setFoundClient(client)
      } else {
        setError('Cliente no encontrado con ese email')
      }
    } catch (err) {
      setError('Error al buscar cliente')
    } finally {
      setSearchingClient(false)
    }
  }

  const fetchBookedSeats = useCallback(async () => {
    if (!selectedMovieId || !selectedDate || !selectedShowtime) return
    try {
      const res = await getReservations({ movieId: selectedMovieId, screeningDate: selectedDate, status: 'active' })
      setBookedSeats(res.data.filter(r => r.showtime === selectedShowtime).map(r => r.seatNumber))
    } catch (err) {
      console.error('Error al obtener asientos reservados:', err)
    }
  }, [selectedMovieId, selectedDate, selectedShowtime])

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
    if (!foundClient || !selectedMovieId || !selectedDate || !selectedShowtime || !selectedSeat) {
      setError('Completa todos los campos')
      return
    }
    setCreating(true)
    setError('')
    try {
      await createReservation({
        movieId: selectedMovieId,
        clientEmail: foundClient.email,
        screeningDate: selectedDate,
        showtime: selectedShowtime,
        seatNumber: selectedSeat
      })
      setSuccess(`Reserva creada: Asiento ${selectedSeat} para ${foundClient.name}`)
      setSelectedSeat(null)
      setFoundClient(null)
      setClientEmail('')
      setSelectedShowtime('')
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
      <Typography variant="h4" gutterBottom>Mi Tienda: {storeName}</Typography>
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
              No hay películas activas en {storeName} en este momento.
            </Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Película</TableCell>
                    <TableCell>Disponibilidad</TableCell>
                    <TableCell>Vigencia</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredMovies.map((m) => {
                    const activeScreenings = m.screenings?.filter(s => s.store?.name === storeName) || []
                    return (
                      <TableRow key={m._id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">{m.title}</Typography>
                          <Typography variant="caption" color="text.secondary">{m.director?.name}</Typography>
                        </TableCell>
                        <TableCell>
                          {activeScreenings.map((s, idx) => (
                            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <TextField
                                size="small" type="number" label="Copias"
                                value={editCopies[`${m._id}-${idx}`] ?? s.copies}
                                onChange={(e) => handleCopyChange(m._id, idx, Number(e.target.value))}
                                sx={{ width: 100 }}
                              />
                              <Button size="small" variant="outlined" onClick={async () => {
                                const newCopies = editCopies[`${m._id}-${idx}`]
                                if (newCopies !== undefined) {
                                  const screenings = m.screenings.map((sc, i) =>
                                    i === idx ? { ...sc, copies: newCopies } : sc
                                  )
                                  await updateMovie(m._id, { screenings })
                                  fetchMovies()
                                }
                              }}>
                                Actualizar
                              </Button>
                            </Box>
                          ))}
                        </TableCell>
                        <TableCell>
                          {activeScreenings.map((s, idx) => (
                            <Typography key={idx} variant="caption" display="block">
                              {new Date(s.startDate).toLocaleDateString('es-MX')} → {new Date(s.endDate).toLocaleDateString('es-MX')}
                            </Typography>
                          ))}
                        </TableCell>
                      </TableRow>
                    )
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
                onKeyDown={e => e.key === 'Enter' && searchClient()}
                sx={{ minWidth: 250 }}
              />
              <Button variant="contained" onClick={searchClient} disabled={searchingClient}>
                {searchingClient ? <CircularProgress size={20} /> : 'Buscar'}
              </Button>
            </Box>

            {foundClient && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Cliente: {foundClient.name} ({foundClient.email})
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                select label="Película" size="small"
                value={selectedMovieId}
                onChange={e => { setSelectedMovieId(e.target.value); setSelectedDate(''); setSelectedShowtime(''); setSelectedSeat(null) }}
                slotProps={{ select: { native: true } }}
                sx={{ minWidth: 250 }}
              >
                <option value="">Seleccionar...</option>
                {filteredMovies.map(m => (
                  <option key={m._id} value={m._id}>{m.title}</option>
                ))}
              </TextField>

              {selectedScreening && (
                <TextField
                  type="date" label="Fecha" size="small"
                  value={selectedDate}
                  onChange={e => { setSelectedDate(e.target.value); setSelectedShowtime(''); setSelectedSeat(null) }}
                  slotProps={{
                    inputLabel: { shrink: true },
                    htmlInput: {
                      min: selectedScreening.startDate?.split('T')[0] || todayStr,
                      max: selectedScreening.endDate?.split('T')[0] || ''
                    }
                  }}
                  sx={{ minWidth: 200 }}
                />
              )}

              {selectedDate && selectedScreening?.showtimes?.length > 0 && (
                <TextField
                  select label="Horario" size="small"
                  value={selectedShowtime}
                  onChange={e => { setSelectedShowtime(e.target.value); setSelectedSeat(null) }}
                  slotProps={{ select: { native: true } }}
                  sx={{ minWidth: 180 }}
                >
                  <option value="">Seleccionar...</option>
                  {selectedScreening.showtimes.map(st => (
                    <option key={st.time} value={st.time}>
                      {st.time} ({st.totalSeats - st.bookedSeats}/{st.totalSeats} libres)
                    </option>
                  ))}
                </TextField>
              )}
            </Box>

            {selectedShowtime && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 2 }}>
                  Selecciona un asiento:
                </Typography>
                <SeatMap
                  totalSeats={10}
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
