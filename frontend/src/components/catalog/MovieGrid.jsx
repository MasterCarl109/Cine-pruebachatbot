import { useState, useEffect, useCallback } from 'react'
import { Container, Typography, Box } from '@mui/material'
import MovieCard from './MovieCard'
import Filters from './Filters'
import { getMovies } from '../../services/api'

export default function MovieGrid() {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ search: '', genre: '', store: '' })

  const fetchMovies = useCallback(async () => {
    try {
      setLoading(true)
      const params = {}
      if (filters.search) params.search = filters.search
      if (filters.genre) params.genre = filters.genre
      if (filters.store) params.store = filters.store
      const { data } = await getMovies(params)
      setMovies(data)
    } catch (err) {
      console.error('Error fetching movies:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchMovies() }, [fetchMovies])

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Catálogo de Películas
      </Typography>
      <Filters filters={filters} onChange={setFilters} />
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">Cargando...</Typography>
        </Box>
      ) : movies.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">No se encontraron películas</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr', lg: '1fr 1fr 1fr 1fr' }, gap: 3 }}>
          {movies.map((movie) => (
            <Box key={movie._id}>
              <MovieCard movie={movie} />
            </Box>
          ))}
        </Box>
      )}
    </Container>
  )
}
