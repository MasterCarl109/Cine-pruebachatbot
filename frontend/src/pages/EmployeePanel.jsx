import { useState, useEffect, useCallback } from 'react'
import { Container, Typography, Button, Box, Tabs, Tab, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Alert, CircularProgress, Chip, Snackbar, FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ChildCareIcon from '@mui/icons-material/ChildCare'
import PersonIcon from '@mui/icons-material/Person'
import CloseIcon from '@mui/icons-material/Close'
import { getMovies, getReservations, createReservation, cancelReservation, searchClient } from '../services/api'
import { useAuth } from '../context/AuthContext'

function SeatMap({ totalSeats, bookedSeats, selectedSeats, onToggle }) {
  const seats = Array.from({ length: totalSeats }, (_, i) => i + 1)

  const getSeatState = (num) => {
    if (bookedSeats.includes(num)) return 'booked'
    const sel = selectedSeats.find(s => s.seatNumber === num)
    if (sel) return sel.ticketType
    return 'free'
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 20, height: 20, bgcolor: 'grey.300', borderRadius: 0.5 }} />
          <Typography variant="caption">Libre</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 20, height: 20, bgcolor: 'error.main', borderRadius: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 'bold' }}>✕</Box>
          <Typography variant="caption">Ocupado</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 20, height: 20, bgcolor: 'primary.main', borderRadius: 0.5 }} />
          <Typography variant="caption">Adulto</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 20, height: 20, bgcolor: 'success.main', borderRadius: 0.5 }} />
          <Typography variant="caption">Infantil</Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {seats.map(num => {
          const state = getSeatState(num)
          const isBooked = state === 'booked'
          const isAdult = state === 'adult'
          const isChild = state === 'child'
          const isFree = state === 'free'
          return (
            <Tooltip key={num} title={isBooked ? 'Ocupado' : isAdult ? 'Adulto (click para cambiar a infantil)' : isChild ? 'Infantil (click para quitar)' : 'Libre (click para agregar)'}>
              <Box
                onClick={() => !isBooked && onToggle(num)}
                sx={{
                  width: 48, height: 48, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', borderRadius: 1,
                  cursor: isBooked ? 'not-allowed' : 'pointer',
                  bgcolor: isBooked ? 'error.main' : isAdult ? 'primary.main' : isChild ? 'success.main' : 'grey.300',
                  color: isBooked || isAdult || isChild ? 'white' : 'text.primary',
                  fontWeight: 'bold', fontSize: '0.85rem',
                  border: isAdult || isChild ? 2 : 0,
                  borderColor: isAdult ? 'primary.dark' : 'success.dark',
                  transition: '0.15s',
                  '&:hover': isBooked ? {} : { opacity: 0.8, transform: 'scale(1.05)' },
                  textDecoration: isBooked ? 'line-through' : 'none'
                }}
              >
                {isBooked ? '✕' : isChild ? <ChildCareIcon sx={{ fontSize: 20 }} /> : num}
              </Box>
            </Tooltip>
          )
        })}
      </Box>
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
  const [inventorySearch, setInventorySearch] = useState('')

  // --- Nueva Reserva ---
  const [clientEmail, setClientEmail] = useState('')
  const [clientName, setClientName] = useState('')
  const [foundClient, setFoundClient] = useState(null)
  const [searchingClient, setSearchingClient] = useState(false)
  const [selectedMovieId, setSelectedMovieId] = useState('')
  const [selectedScreeningKey, setSelectedScreeningKey] = useState('')
  const [selectedSeats, setSelectedSeats] = useState([])
  const [bookedSeats, setBookedSeats] = useState([])
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // --- Listado de reservas ---
  const [reservations, setReservations] = useState([])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const fetchMovies = useCallback(async () => {
    const res = await getMovies()
    setMovies(res.data)
  }, [])

  useEffect(() => { fetchMovies() }, [fetchMovies])

  const storeMovies = movies.filter(m =>
    m.screenings?.some(s => String(s.store?._id || s.store) === String(storeId))
  )

  const filteredMovies = inventorySearch
    ? storeMovies.filter(m =>
        m.title.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        (m.director?.name || '').toLowerCase().includes(inventorySearch.toLowerCase())
      )
    : storeMovies

  // Obtener screenings futuros de la tienda
  const selectedMovie = movies.find(m => m._id === selectedMovieId)
  const storeFutureScreenings = selectedMovie?.screenings?.filter(s => {
    const sameStore = String(s.store?._id || s.store) === String(storeId)
    const future = new Date(s.date) >= today
    return sameStore && future
  }) || []

  const selectedScreening = storeFutureScreenings.find(
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
      setClientName('')
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

  const handleToggleSeat = (seatNumber) => {
    setSelectedSeats(prev => {
      const existing = prev.find(s => s.seatNumber === seatNumber)
      if (!existing) {
        return [...prev, { seatNumber, ticketType: 'adult' }]
      }
      if (existing.ticketType === 'adult') {
        return prev.map(s => s.seatNumber === seatNumber ? { ...s, ticketType: 'child' } : s)
      }
      return prev.filter(s => s.seatNumber !== seatNumber)
    })
  }

  const handleCreateReservation = async () => {
    if (selectedSeats.length === 0) {
      setError('Selecciona al menos un asiento')
      return
    }
    if (clientEmail.trim() && !foundClient) {
      setError('Busca un cliente válido o limpia el email para reserva presencial')
      return
    }
    setCreating(true)
    setError('')
    try {
      const dateStr = new Date(selectedScreening.date).toISOString().split('T')[0]
      const payload = {
        movieId: selectedMovieId,
        screeningDate: dateStr,
        showtime: selectedScreening.time,
        room: selectedScreening.room,
        seats: selectedSeats
      }
      if (foundClient) {
        payload.clientEmail = foundClient.email
      } else if (clientName.trim()) {
        payload.clientName = clientName.trim()
      }

      const { data } = await createReservation(payload)
      const adultCount = selectedSeats.filter(s => s.ticketType === 'adult').length
      const childCount = selectedSeats.filter(s => s.ticketType === 'child').length
      const clientLabel = data.clientName || 'Sin nombre'
      setSuccess(`${selectedSeats.length} asiento(s) (${adultCount} adulto + ${childCount} infantil) reservado(s) para ${clientLabel}`)
      setSelectedSeats([])
      setFoundClient(null)
      setClientEmail('')
      setClientName('')
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

  const adultCount = selectedSeats.filter(s => s.ticketType === 'adult').length
  const childCount = selectedSeats.filter(s => s.ticketType === 'child').length

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
          <TextField
            size="small" placeholder="Buscar película..."
            value={inventorySearch}
            onChange={e => setInventorySearch(e.target.value)}
            slotProps={{ input: { startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> } }}
            sx={{ mb: 2, maxWidth: 400 }}
          />
          {filteredMovies.length === 0 ? (
            <Typography variant="body1" color="text.secondary">
              {inventorySearch ? 'No hay películas que coincidan con la búsqueda.' : 'No hay películas activas en tu tienda en este momento.'}
            </Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Película</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Hora</TableCell>
                    <TableCell>Sala</TableCell>
                    <TableCell>Asientos</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredMovies.map((m) => {
                    const myScreenings = (m.screenings || []).filter(s => {
                      const sameStore = String(s.store?._id || s.store) === String(storeId)
                      const future = new Date(s.date) >= today
                      return sameStore && future
                    })
                    return myScreenings.map((s, idx) => (
                      <TableRow key={`${m._id}-${idx}`}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">{m.title}</Typography>
                          <Typography variant="caption" color="text.secondary">{m.director?.name}</Typography>
                        </TableCell>
                        <TableCell>{new Date(s.date).toLocaleDateString('es-MX')}</TableCell>
                        <TableCell>{s.time}</TableCell>
                        <TableCell>{s.room}</TableCell>
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
                label="Email del cliente (opcional)" size="small"
                value={clientEmail}
                onChange={e => { setClientEmail(e.target.value); setFoundClient(null) }}
                onKeyDown={e => e.key === 'Enter' && handleSearchClient()}
              />
              <Button variant="contained" onClick={handleSearchClient} disabled={searchingClient || !clientEmail.trim()}>
                {searchingClient ? <CircularProgress size={20} /> : 'Buscar'}
              </Button>
              <TextField
                label="Nombre del cliente (presencial)" size="small"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                disabled={!!foundClient}
                sx={{ minWidth: 220 }}
              />
            </Box>

            {foundClient && (
              <Alert severity="success" sx={{ mb: 2 }} action={
                <IconButton size="small" color="inherit" onClick={() => { setFoundClient(null); setClientEmail('') }}><CloseIcon fontSize="small" /></IconButton>
              }>
                Cliente: {foundClient.name} ({foundClient.email})
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 250 }}>
                <InputLabel>Película</InputLabel>
                <Select
                  value={selectedMovieId}
                  label="Película"
                  onChange={e => { setSelectedMovieId(e.target.value); setSelectedScreeningKey(''); setSelectedSeats([]); setBookedSeats([]) }}
                >
                  <MenuItem value="">Seleccionar...</MenuItem>
                  {storeMovies.map(m => (
                    <MenuItem key={m._id} value={m._id}>{m.title}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {storeFutureScreenings.length > 0 && (
                <FormControl size="small" sx={{ minWidth: 280 }}>
                  <InputLabel>Función</InputLabel>
                  <Select
                    value={selectedScreeningKey}
                    label="Función"
                    onChange={e => { setSelectedScreeningKey(e.target.value); setSelectedSeats([]) }}
                  >
                    <MenuItem value="">Seleccionar...</MenuItem>
                    {storeFutureScreenings.map((s, idx) => {
                      const key = `${new Date(s.date).toISOString().split('T')[0]}-${s.time}`
                      const free = s.totalSeats - s.bookedSeats
                      return (
                        <MenuItem key={idx} value={key}>
                          {new Date(s.date).toLocaleDateString('es-MX')} - {s.time} - {s.room} ({free}/{s.totalSeats})
                        </MenuItem>
                      )
                    })}
                  </Select>
                </FormControl>
              )}
            </Box>

            {selectedScreening && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                  Selecciona asientos (click: adulto → infantil → quitar):
                </Typography>
                <SeatMap
                  totalSeats={selectedScreening.totalSeats}
                  bookedSeats={bookedSeats}
                  selectedSeats={selectedSeats}
                  onToggle={handleToggleSeat}
                />
                {selectedSeats.length > 0 && (
                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PersonIcon fontSize="small" color="primary" /> {adultCount} adulto(s)
                      <Box sx={{ mx: 1 }} />
                      <ChildCareIcon fontSize="small" color="success" /> {childCount} infantil(es)
                    </Typography>
                    <Chip label={`${selectedSeats.length} asiento(s)`} color="primary" size="small" />
                    <Box sx={{ flex: 1 }} />
                    <Button
                      variant="contained" color="primary"
                      disabled={creating}
                      onClick={handleCreateReservation}
                    >
                      {creating ? <CircularProgress size={20} /> : `Confirmar Reserva`}
                    </Button>
                  </Box>
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
                      <TableCell>Sala</TableCell>
                      <TableCell>Asiento</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Monto</TableCell>
                      <TableCell>Acción</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reservations.map(r => (
                      <TableRow key={r._id}>
                        <TableCell>{r.movie?.title}</TableCell>
                        <TableCell>{r.client?.name || r.clientName || '—'}</TableCell>
                        <TableCell>{new Date(r.screeningDate).toLocaleDateString('es-MX')}</TableCell>
                        <TableCell>{r.showtime}</TableCell>
                        <TableCell>{r.room}</TableCell>
                        <TableCell>{r.seatNumber}</TableCell>
                        <TableCell>
                          <Chip
                            label={r.ticketType === 'child' ? 'Infantil' : 'Adulto'}
                            size="small"
                            color={r.ticketType === 'child' ? 'success' : 'default'}
                            icon={r.ticketType === 'child' ? <ChildCareIcon /> : undefined}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={r.status === 'active' ? 'Activa' : 'Cancelada'}
                            color={r.status === 'active' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>${r.amount}</TableCell>
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
