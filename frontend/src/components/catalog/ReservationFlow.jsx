import { useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, TextField, MenuItem, Stepper, Step, StepLabel, Alert, CircularProgress, Chip, Divider, Paper } from '@mui/material'
import { clientReserve } from '../../services/api'

const STEPS = ['Asientos', 'Pago', 'Confirmación']

export default function ReservationFlow({ open, onClose, movie, store, storeId, screeningDate, showtime, room, availableSeats }) {
  const [activeStep, setActiveStep] = useState(0)
  const [numSeats, setNumSeats] = useState(1)
  const [seats, setSeats] = useState([{ seatNumber: '', ticketType: 'adult' }])
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  if (!movie) return null

  const reset = () => {
    setActiveStep(0)
    setNumSeats(1)
    setSeats([{ seatNumber: '', ticketType: 'adult' }])
    setPin('')
    setError('')
    setLoading(false)
    setResult(null)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleNumSeatsChange = (val) => {
    const n = Math.min(Math.max(1, Number(val)), availableSeats)
    setNumSeats(n)
    setSeats(Array.from({ length: n }, (_, i) => seats[i] || { seatNumber: '', ticketType: 'adult' }))
  }

  const updateSeat = (idx, field, value) => {
    const updated = [...seats]
    updated[idx] = { ...updated[idx], [field]: value }
    setSeats(updated)
  }

  const validateSeats = () => {
    const numbers = seats.map(s => Number(s.seatNumber))
    if (numbers.some(n => !n || n < 1)) {
      setError('Todos los asientos deben tener un número válido')
      return false
    }
    if (new Set(numbers).size !== numbers.length) {
      setError('No puedes repetir números de asiento')
      return false
    }
    return true
  }

  const handleContinue = () => {
    setError('')
    if (!validateSeats()) return
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
        seats: seats.map(s => ({ seatNumber: Number(s.seatNumber), ticketType: s.ticketType })),
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

  const totalAmount = seats.reduce((sum, s) => sum + calcAmount(s.ticketType), 0)

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
            <TextField
              label="Cantidad de asientos"
              type="number"
              size="small"
              fullWidth
              value={numSeats}
              onChange={e => handleNumSeatsChange(e.target.value)}
              inputProps={{ min: 1, max: availableSeats }}
              sx={{ mb: 2 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Asientos disponibles: {availableSeats}
            </Typography>
            {seats.map((s, i) => (
              <Box key={i} sx={{ display: 'flex', gap: 2, mb: 1.5, alignItems: 'center' }}>
                <Typography variant="body2" sx={{ minWidth: 60 }}>Asiento {i + 1}</Typography>
                <TextField
                  size="small"
                  label="Número"
                  type="number"
                  value={s.seatNumber}
                  onChange={e => updateSeat(i, 'seatNumber', e.target.value)}
                  inputProps={{ min: 1 }}
                  sx={{ width: 100 }}
                />
                <TextField
                  select
                  size="small"
                  label="Tipo"
                  value={s.ticketType}
                  onChange={e => updateSeat(i, 'ticketType', e.target.value)}
                  sx={{ width: 120 }}
                >
                  <MenuItem value="adult">Adulto</MenuItem>
                  <MenuItem value="child">Niño</MenuItem>
                </TextField>
                <Typography variant="body2" color="text.secondary">
                  ${calcAmount(s.ticketType)}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>Resumen de tu reserva</Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              {seats.map((s, i) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">
                    Asiento {s.seatNumber} — {s.ticketType === 'child' ? 'Niño' : 'Adulto'}
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
              inputProps={{ maxLength: 6, inputMode: 'numeric' }}
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
                <Typography variant="body2">Asiento {r.seatNumber} — {r.ticketType === 'child' ? 'Niño' : 'Adulto'}</Typography>
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
              <Button variant="contained" onClick={handleContinue}>Continuar</Button>
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
