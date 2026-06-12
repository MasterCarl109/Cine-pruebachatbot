import { useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Chip, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Alert } from '@mui/material'
import LocalOfferIcon from '@mui/icons-material/LocalOffer'
import ReservationFlow from './ReservationFlow'
import { useAuth } from '../../context/AuthContext'

export default function MovieDetailDialog({ open, movie, onClose }) {
  const { user } = useAuth()
  const [reserveTarget, setReserveTarget] = useState(null)

  if (!movie) return null

  const isClient = user?.type === 'client'

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const activeScreenings = movie.screenings?.filter(s => {
    const date = new Date(s.date)
    date.setHours(0, 0, 0, 0)
    return date >= today
  }) || []

  const activeOffers = movie.offers?.filter(o =>
    o.active && new Date(o.startDate) <= new Date() && new Date(o.endDate) >= new Date()
  ) || []

  const handleReserve = (s) => {
    setReserveTarget({
      store: s.store?.name || 'Desconocida',
      storeId: s.store?._id || s.store,
      screeningDate: s.date,
      showtime: s.time,
      room: s.room,
      availableSeats: s.totalSeats - s.bookedSeats,
      totalSeats: s.totalSeats
    })
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="h5">{movie.title}</Typography>
            <Chip label={`$${movie.price}`} size="small" color="primary" variant="outlined" />
            <Chip label={movie.rating} size="small" color="primary" variant="outlined" />
            {movie.duration && <Chip label={`${movie.duration} min`} size="small" variant="outlined" />}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" sx={{ mb: 2 }}>{movie.synopsis}</Typography>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Director:</strong> {movie.director?.name || 'Desconocido'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Géneros:</strong> {movie.genres?.map(g => g.name).join(', ') || 'N/A'}
            </Typography>
          {movie.releaseDate && (
            <Typography variant="body2" color="text.secondary">
              <strong>Estreno:</strong> {new Date(movie.releaseDate).toLocaleDateString('es-MX')}
            </Typography>
          )}
        </Box>

        {activeOffers.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <LocalOfferIcon fontSize="small" color="primary" /> Ofertas activas
            </Typography>
            {activeOffers.map((o, idx) => (
              <Alert key={idx} severity="info" icon={false} sx={{ mb: 0.5, py: 0.5 }}>
                <Typography variant="body2">
                  <strong>{o.discountPercent}% OFF</strong> — {o.description}
                  {o.store?.name ? ` (válido en ${o.store.name})` : ' (válido en todas las tiendas)'}
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    hasta {new Date(o.endDate).toLocaleDateString('es-MX')}
                  </Typography>
                </Typography>
              </Alert>
            ))}
          </Box>
        )}

        {activeScreenings.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              No hay funciones disponibles en este momento.
            </Typography>
          ) : (
            <>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Funciones Disponibles</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tienda</TableCell>
                      <TableCell>Sala</TableCell>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Hora</TableCell>
                      <TableCell>Asientos</TableCell>
                      {isClient && <TableCell></TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activeScreenings.map((s, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{s.store?.name || 'Desconocida'}</TableCell>
                        <TableCell>{s.room || '—'}</TableCell>
                        <TableCell>{new Date(s.date).toLocaleDateString('es-MX')}</TableCell>
                        <TableCell>{s.time}</TableCell>
                        <TableCell>
                          <Chip
                            label={`${s.totalSeats - s.bookedSeats}/${s.totalSeats}`}
                            size="small"
                            color={s.totalSeats - s.bookedSeats > 0 ? 'success' : 'error'}
                            variant="outlined"
                          />
                        </TableCell>
                        {isClient && (
                          <TableCell>
                            <Button
                              size="small"
                              variant="contained"
                              disabled={s.totalSeats - s.bookedSeats <= 0}
                              onClick={() => handleReserve(s)}
                            >
                              Reservar
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {reserveTarget && (
        <ReservationFlow
          open={!!reserveTarget}
          movie={movie}
          store={reserveTarget.store}
          storeId={reserveTarget.storeId}
          screeningDate={reserveTarget.screeningDate}
          showtime={reserveTarget.showtime}
          room={reserveTarget.room}
          availableSeats={reserveTarget.availableSeats}
          totalSeats={reserveTarget.totalSeats}
          onClose={() => setReserveTarget(null)}
        />
      )}
    </>
  )
}
