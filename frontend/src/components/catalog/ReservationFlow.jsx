import { useState, useEffect } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Stepper, Step, StepLabel, Alert, CircularProgress, Chip, Divider, Paper, TextField, Tooltip } from '@mui/material'
import ChildCareIcon from '@mui/icons-material/ChildCare'
import { clientReserve, getOccupiedSeats } from '../../services/api'

const STEPS = ['Asientos', 'Pago', 'Confirmación']

function SeatMap({ totalSeats, occupiedSeats, selectedSeats, onToggle }) {
  const seats = Array.from({ length: totalSeats }, (_, i) => i + 1)

  const getSeatState = (num) => {
    if (occupiedSeats.includes(num)) return 'booked'
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
          return (
            <Tooltip key={num} title={isBooked ? 'Ocupado' : isAdult ? 'Adulto (click → infantil)' : isChild ? 'Infantil (click → quitar)' : 'Libre (click → adulto)'}>
              <Box
                onClick={() => !isBooked && onToggle(num)}
                sx={{
                  width: 44, height: 44, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', borderRadius: 1,
                  cursor: isBooked ? 'not-allowed' : 'pointer',
                  bgcolor: isBooked ? 'error.main' : isAdult ? 'primary.main' : isChild ? 'success.main' : 'grey.300',
                  color: isBooked || isAdult || isChild ? 'white' : 'text.primary',
                  fontWeight: 'bold', fontSize: '0.8rem',
                  border: isAdult || isChild ? 2 : 0,
                  borderColor: isAdult ? 'primary.dark' : 'success.dark',
                  transition: '0.15s',
                  '&:hover': isBooked ? {} : { opacity: 0.8, transform: 'scale(1.05)' },
                  textDecoration: isBooked ? 'line-through' : 'none'
                }}
              >
                {isBooked ? '✕' : isChild ? <ChildCareIcon sx={{ fontSize: 18 }} /> : num}
              </Box>
            </Tooltip>
          )
        })}
      </Box>
    </Box>
  )
}

export default function ReservationFlow({ open, onClose, movie, store, storeId, screeningDate, showtime, room, availableSeats, totalSeats }) {
  const [activeStep, setActiveStep] = useState(0)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [occupiedSeats, setOccupiedSeats] = useState([])
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [loadingSeats, setLoadingSeats] = useState(false)

  useEffect(() => {
    if (open) {
      setSelectedSeats([])
      setPin('')
      setError('')
      setLoading(false)
      setResult(null)
      setActiveStep(0)
      fetchOccupiedSeats()
    }
  }, [open])

  const fetchOccupiedSeats = async () => {
    setLoadingSeats(true)
    try {
      const { data } = await getOccupiedSeats({
        movieId: movie._id,
        storeId,
        screeningDate,
        showtime,
        room
      })
      setOccupiedSeats(data.occupied || [])
    } catch (err) {
      console.error('Error al obtener asientos ocupados:', err)
    } finally {
      setLoadingSeats(false)
    }
  }

  if (!movie) return null

  const handleClose = () => {
    setSelectedSeats([])
    setOccupiedSeats([])
    onClose()
  }

  const toggleSeat = (num) => {
    setSelectedSeats(prev => {
      const existing = prev.find(s => s.seatNumber === num)
      if (!existing) return [...prev, { seatNumber: num, ticketType: 'adult' }]
      if (existing.ticketType === 'adult') return prev.map(s => s.seatNumber === num ? { ...s, ticketType: 'child' } : s)
      return prev.filter(s => s.seatNumber !== num)
    })
  }

  const handleContinue = () => {
    setError('')
    if (selectedSeats.length === 0) {
      setError('Selecciona al menos un asiento')
      return
    }
    setActiveStep(1)
  }

  const handleConfirm = async () => {
    setError('')
    if (!pin || pin.length < 4) {
      setError('Ingresa tu PIN de 6 dígitos')
      return
    }
    setLoading(true)
    try {
      const { data } = await clientReserve({
        movieId: movie._id,
        storeId,
        screeningDate,
        showtime,
        room,
        seats: selectedSeats.map(s => ({ seatNumber: s.seatNumber, ticketType: s.ticketType })),
        pin
      })
      setResult(data)
      setActiveStep(2)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar la reserva')
    } finally {
      setLoading(false)
    }
  }

  const basePrice = movie.price
  const activeOffer = movie.offers?.find(o =>
    o.active &&
    (!o.store || o.store === storeId) &&
    new Date(o.startDate) <= new Date() && new Date(o.endDate) >= new Date()
  )

  const calcAmount = (ticketType) => {
    let p = basePrice
    if (activeOffer) p = p - (p * activeOffer.discountPercent / 100)
    if (ticketType === 'child') p = p - (p * 0.30)
    return Math.round(p)
  }

  const totalAmount = selectedSeats.reduce((sum, s) => sum + calcAmount(s.ticketType), 0)
  const adultsCount = selectedSeats.filter(s => s.ticketType === 'adult').length
  const childsCount = selectedSeats.filter(s => s.ticketType === 'child').length

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Reservar — {movie.title}</Typography>
          <Chip label={`$${basePrice}`} color="primary" size="small" />
        </Box>
      </DialogTitle>
      <Stepper activeStep={activeStep} sx={{ px: 3, pt: 1 }}>
        {STEPS.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
      </Stepper>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {store} — {new Date(screeningDate).toLocaleDateString('es-MX')} {showtime} — Sala {room}
          {availableSeats != null && (
            <Chip label={`${availableSeats} disponibles`} size="small" color={availableSeats > 0 ? 'success' : 'error'} variant="outlined" sx={{ ml: 1 }} />
          )}
        </Typography>

        {activeOffer && (
          <Alert severity="info" sx={{ mb: 2 }} icon={false}>
            <Typography variant="caption">
              Oferta activa: {activeOffer.discountPercent}% de descuento
              {activeOffer.description ? ` — ${activeOffer.description}` : ''}
            </Typography>
          </Alert>
        )}

        {activeStep === 0 && (
          <Box>
            {loadingSeats ? (
              <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>
            ) : (
              <SeatMap
                totalSeats={totalSeats}
                occupiedSeats={occupiedSeats}
                selectedSeats={selectedSeats}
                onToggle={toggleSeat}
              />
            )}

            {selectedSeats.length > 0 && (
              <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Asientos seleccionados</Typography>
                {selectedSeats.map(s => (
                  <Box key={s.seatNumber} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body2">
                      Asiento {s.seatNumber} — {s.ticketType === 'child' ? 'Infantil' : 'Adulto'}
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        (click para cambiar)
                      </Typography>
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">${calcAmount(s.ticketType)}</Typography>
                  </Box>
                ))}
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {adultsCount} adulto{adultsCount !== 1 ? 's' : ''}{childsCount > 0 ? `, ${childsCount} infantil${childsCount !== 1 ? 'es' : ''}` : ''}
                  </Typography>
                  <Typography variant="subtitle1" color="primary" fontWeight="bold">Total: ${totalAmount}</Typography>
                </Box>
              </Paper>
            )}
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>Resumen de tu reserva</Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              {selectedSeats.map(s => (
                <Box key={s.seatNumber} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">
                    Asiento {s.seatNumber} — {s.ticketType === 'child' ? 'Infantil' : 'Adulto'}
                  </Typography>
                  <Typography variant="body2">${calcAmount(s.ticketType)}</Typography>
                </Box>
              ))}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2">Total</Typography>
                <Typography variant="subtitle2" color="primary">${totalAmount}</Typography>
              </Box>
            </Paper>
            <TextField
              label="PIN de tu tarjeta virtual"
              type="password"
              size="small"
              fullWidth
              value={pin}
              onChange={e => setPin(e.target.value)}
              slotProps={{ htmlInput: { maxLength: 6, inputMode: 'numeric' } }}
              sx={{ mb: 1 }}
            />
            <Typography variant="caption" color="text.secondary">
              Ingresa tu PIN de 6 dígitos para confirmar el pago.
            </Typography>
          </Box>
        )}

        {activeStep === 2 && result && (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              ¡Reserva confirmada! Se descontaron ${result.totalAmount} de tu saldo.
            </Alert>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Nuevo saldo: <strong>${result.newBalance.toLocaleString('es-MX')}</strong>
            </Typography>
            <Typography variant="subtitle2" gutterBottom>Asientos reservados:</Typography>
            {result.reservations.map(r => (
              <Box key={r._id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">Asiento {r.seatNumber} — {r.ticketType === 'child' ? 'Infantil' : 'Adulto'}</Typography>
                <Typography variant="body2" color="success.main">${r.amount}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {activeStep < 2 ? (
          <>
            <Button onClick={handleClose} disabled={loading}>Cancelar</Button>
            {activeStep === 0 ? (
              <Button variant="contained" onClick={handleContinue} disabled={selectedSeats.length === 0}>
                Continuar{selectedSeats.length > 0 ? ` (${selectedSeats.length})` : ''}
              </Button>
            ) : (
              <Button variant="contained" onClick={handleConfirm} disabled={loading}>
                {loading ? <CircularProgress size={20} /> : 'Confirmar y Pagar'}
              </Button>
            )}
          </>
        ) : (
          <Button variant="contained" onClick={handleClose}>Cerrar</Button>
        )}
      </DialogActions>
    </Dialog>
  )
}