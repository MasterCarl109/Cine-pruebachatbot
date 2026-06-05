import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Chip, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material'

export default function MovieDetailDialog({ open, movie, onClose }) {
  if (!movie) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const activeScreenings = movie.screenings?.filter(s => {
    const date = new Date(s.date)
    date.setHours(0, 0, 0, 0)
    return date >= today
  }) || []

  const groupedByStore = activeScreenings.reduce((acc, s) => {
    const storeName = s.store?.name || 'Desconocida'
    if (!acc[storeName]) acc[storeName] = []
    acc[storeName].push(s)
    return acc
  }, {})

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

        {Object.keys(groupedByStore).length === 0 ? (
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
                    <TableCell>Fecha</TableCell>
                    <TableCell>Hora</TableCell>
                    <TableCell>Asientos</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(groupedByStore).map(([storeName, screenings]) =>
                    screenings.map((s, idx) => (
                      <TableRow key={`${storeName}-${idx}`}>
                        {idx === 0 ? (
                          <TableCell rowSpan={screenings.length}>
                            <Typography fontWeight="bold">{storeName}</Typography>
                          </TableCell>
                        ) : null}
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
                      </TableRow>
                    ))
                  )}
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
