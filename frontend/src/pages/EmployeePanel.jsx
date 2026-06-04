import { useState, useEffect, useCallback } from 'react'
import { Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Button, Box } from '@mui/material'
import { getMovies, updateMovie } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function EmployeePanel() {
  const { user } = useAuth()
  const [movies, setMovies] = useState([])
  const [editCopies, setEditCopies] = useState({})

  const storeName = user?.store?.name || 'tu tienda'

  const fetchData = useCallback(async () => {
    const res = await getMovies()
    setMovies(res.data)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filteredMovies = movies.filter(m =>
    m.screenings?.some(s => s.store?.name === storeName)
  )

  const handleCopyChange = (movieId, screeningIdx, val) => {
    setEditCopies(prev => ({ ...prev, [`${movieId}-${screeningIdx}`]: val }))
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Mi Tienda: {storeName}</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Bienvenido, {user?.name}
      </Typography>

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
                            size="small"
                            type="number"
                            label="Copias"
                            value={editCopies[`${m._id}-${idx}`] ?? s.copies}
                            onChange={(e) => handleCopyChange(m._id, idx, Number(e.target.value))}
                            sx={{ width: 100 }}
                          />
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={async () => {
                              const newCopies = editCopies[`${m._id}-${idx}`]
                              if (newCopies !== undefined) {
                                      const screenings = m.screenings.map((sc, i) =>
                                  i === idx ? { ...sc, copies: newCopies } : sc
                                )
                                await updateMovie(m._id, { screenings })
                                fetchData()
                              }
                            }}
                          >
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
    </Container>
  )
}
