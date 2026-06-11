import { useState, useEffect, useCallback } from 'react'
import { Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Box, Alert, CircularProgress, Card, CardContent, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import CancelIcon from '@mui/icons-material/Cancel'
import { getMyReservations, getClientProfile, clientCancelReservation } from '../services/api'

export default function ClientReservations() {
  const [reservations, setReservations] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [resRes, profileRes] = await Promise.all([
        getMyReservations(),
        getClientProfile()
      ])
      setReservations(resRes.data)
      setProfile(profileRes.data)
    } catch (err) {
      setError('Error al cargar tus reservas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCancel = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      await clientCancelReservation(cancelTarget._id)
      setCancelTarget(null)
      fetchData()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cancelar reserva')
    } finally {
      setCancelling(false)
    }
  }

  const activeReservations = reservations.filter(r => r.status === 'active')
  const pastReservations = reservations.filter(r => r.status !== 'active')

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    )
  }

  const renderTable = (data, showCancel) => (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell sx={{ color: 'white', fontWeight: 600 }}>Película</TableCell>
          <TableCell sx={{ color: 'white', fontWeight: 600 }}>Tienda</TableCell>
          <TableCell sx={{ color: 'white', fontWeight: 600 }}>Sala</TableCell>
          <TableCell sx={{ color: 'white', fontWeight: 600 }}>Fecha</TableCell>
          <TableCell sx={{ color: 'white', fontWeight: 600 }}>Horario</TableCell>
          <TableCell sx={{ color: 'white', fontWeight: 600 }}>Asiento</TableCell>
          <TableCell sx={{ color: 'white', fontWeight: 600 }}>Tipo</TableCell>
          <TableCell sx={{ color: 'white', fontWeight: 600 }}>Monto</TableCell>
          <TableCell sx={{ color: 'white', fontWeight: 600 }}>Estado</TableCell>
          {showCancel && <TableCell sx={{ color: 'white', fontWeight: 600 }}></TableCell>}
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map(r => (
          <TableRow key={r._id}>
            <TableCell sx={{ color: 'white' }}>{r.movie?.title || '—'}</TableCell>
            <TableCell sx={{ color: 'white' }}>{r.store?.name || '—'}</TableCell>
            <TableCell sx={{ color: 'white' }}>{r.room || '—'}</TableCell>
            <TableCell sx={{ color: 'white' }}>
              {new Date(r.screeningDate).toLocaleDateString('es-MX')}
            </TableCell>
            <TableCell sx={{ color: 'white' }}>{r.showtime}</TableCell>
            <TableCell sx={{ color: 'white' }}>{r.seatNumber}</TableCell>
            <TableCell>
              <Chip
                label={r.ticketType === 'child' ? 'Niño' : 'Adulto'}
                size="small"
                color={r.ticketType === 'child' ? 'info' : 'default'}
                variant="outlined"
              />
            </TableCell>
            <TableCell sx={{ color: 'white' }}>${r.amount}</TableCell>
            <TableCell>
              <Chip
                label={r.status === 'active' ? 'Confirmada' : 'Cancelada'}
                color={r.status === 'active' ? 'success' : 'default'}
                size="small"
              />
            </TableCell>
            {showCancel && (
              <TableCell>
                <Button
                  size="small"
                  color="error"
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => setCancelTarget(r)}
                >
                  Cancelar
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Mis Reservas</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {profile && (
        <Card sx={{ mb: 3, bgcolor: '#16213e', border: '1px solid rgba(255,255,255,0.08)' }}>
          <CardContent sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CreditCardIcon sx={{ color: 'primary.main' }} />
              <Box>
                <Typography variant="caption" color="text.secondary">Tarjeta</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', letterSpacing: 1 }}>
                  **** **** **** {profile.lastDigits}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccountBalanceWalletIcon sx={{ color: 'success.main' }} />
              <Box>
                <Typography variant="caption" color="text.secondary">Saldo disponible</Typography>
                <Typography variant="h6" sx={{ color: 'success.main', fontWeight: 700 }}>
                  ${profile.balance.toLocaleString('es-MX')}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {activeReservations.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Reservas Activas</Typography>
          <TableContainer component={Paper} sx={{ mb: 3, bgcolor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)' }}>
            {renderTable(activeReservations, true)}
          </TableContainer>
        </>
      )}

      {pastReservations.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Historial</Typography>
          <TableContainer component={Paper} sx={{ mb: 3, bgcolor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)' }}>
            {renderTable(pastReservations, false)}
          </TableContainer>
        </>
      )}

      {reservations.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Typography variant="h6" color="text.secondary">No tienes reservas</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Visita nuestro catálogo para encontrar tu próxima película.
          </Typography>
        </Paper>
      )}

      <Dialog open={!!cancelTarget} onClose={() => !cancelling && setCancelTarget(null)}>
        <DialogTitle>Cancelar reserva</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Cancelar la reserva del asiento {cancelTarget?.seatNumber} para {cancelTarget?.movie?.title}?
          </Typography>
          {cancelTarget?.amount && (
            <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
              Se reembolsarán ${cancelTarget.amount} a tu saldo.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelTarget(null)} disabled={cancelling}>Volver</Button>
          <Button onClick={handleCancel} color="error" variant="contained" disabled={cancelling}>
            {cancelling ? <CircularProgress size={20} /> : 'Cancelar reserva'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
