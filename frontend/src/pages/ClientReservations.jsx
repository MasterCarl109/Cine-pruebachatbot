import { useState, useEffect, useCallback } from 'react'
import { Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Box, Alert, CircularProgress } from '@mui/material'
import { getMyReservations } from '../services/api'

export default function ClientReservations() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await getMyReservations()
      setReservations(data)
    } catch (err) {
      setError('Error al cargar tus reservas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchReservations() }, [fetchReservations])

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Mis Reservas</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {reservations.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Typography variant="h6" color="text.secondary">No tienes reservas activas</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Visita nuestro catálogo para encontrar tu próxima película.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ bgcolor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Película</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Tienda</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Fecha</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Horario</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Asiento</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Estado</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Atendido por</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reservations.map(r => (
                <TableRow key={r._id}>
                  <TableCell sx={{ color: 'white' }}>{r.movie?.title || '—'}</TableCell>
                  <TableCell sx={{ color: 'white' }}>{r.store?.name || '—'}</TableCell>
                  <TableCell sx={{ color: 'white' }}>
                    {new Date(r.screeningDate).toLocaleDateString('es-MX')}
                  </TableCell>
                  <TableCell sx={{ color: 'white' }}>{r.showtime}</TableCell>
                  <TableCell sx={{ color: 'white' }}>{r.seatNumber}</TableCell>
                  <TableCell>
                    <Chip
                      label={r.status === 'active' ? 'Confirmada' : 'Cancelada'}
                      color={r.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ color: 'white' }}>{r.createdBy?.name || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  )
}
