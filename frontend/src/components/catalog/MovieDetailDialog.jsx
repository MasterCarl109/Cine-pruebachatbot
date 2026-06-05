import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Chip, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material'

export default function MovieDetailDialog({ open, movie, onClose }) {
  if (!movie) return null

  const now = new Date()
  const activeScreenings = movie.screenings?.filter(s => {
    const start = new Date(s.startDate)
    const end = new Date(s.endDate)
    end.setHours(23, 59, 59, 999)
    return start <= now && end >= now
  }) || []

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="h5">{movie.title}</Typography>
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
                    <TableCell>Vigencia</TableCell>
                    <TableCell>Copias</TableCell>
                    <TableCell>Horarios</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeScreenings.map((s, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Typography fontWeight="bold">{s.store?.name || 'Desconocida'}</Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(s.startDate).toLocaleDateString('es-MX')} → {new Date(s.endDate).toLocaleDateString('es-MX')}
                      </TableCell>
                      <TableCell>{s.copies}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {s.showtimes?.map(st => (
                            <Chip
                              key={st.time}
                              label={`${st.time} (${(st.totalSeats || 10) - (st.bookedSeats || 0)}/${st.totalSeats || 10})`}
                              size="small"
                              color={(st.totalSeats || 10) - (st.bookedSeats || 0) > 0 ? 'success' : 'error'}
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </TableCell>
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
  )
}
