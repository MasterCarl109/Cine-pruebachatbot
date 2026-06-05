import { Box, Container, Typography, Button, Grid } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import MovieIcon from '@mui/icons-material/Movie'
import LocalMoviesIcon from '@mui/icons-material/LocalMovies'
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber'
import ChatIcon from '@mui/icons-material/Chat'

const features = [
  { icon: <LocalMoviesIcon sx={{ fontSize: 40 }} />, title: 'Catálogo Amplio', desc: 'Explora nuestra colección de películas de todos los géneros.' },
  { icon: <ConfirmationNumberIcon sx={{ fontSize: 40 }} />, title: 'Reserva Fácil', desc: 'Compra tus boletos en mostrador con solo dar tu email.' },
  { icon: <ChatIcon sx={{ fontSize: 40 }} />, title: 'Asistente Virtual', desc: 'Pregúntale a nuestro chatbot sobre películas y horarios.' }
]

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <Box>
      <Box sx={{
        minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
        position: 'relative', overflow: 'hidden'
      }}>
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.05,
          background: 'radial-gradient(circle at 30% 50%, #e50914 0%, transparent 50%), radial-gradient(circle at 70% 50%, #f5c518 0%, transparent 50%)'
        }} />
        <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <MovieIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
          <Typography variant="h2" sx={{ fontWeight: 800, mb: 2, letterSpacing: '-1px', fontSize: { xs: '2.5rem', md: '3.75rem' } }}>
            CineClub
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 4, fontWeight: 400 }}>
            Tu videoclub de confianza. Películas, horarios y reservas en un solo lugar.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="contained" color="primary" size="large" onClick={() => navigate('/catalogo')}>
              Explorar Catálogo
            </Button>
            <Button variant="outlined" color="inherit" size="large" onClick={() => navigate('/login')} sx={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white', '&:hover': { borderColor: 'white' } }}>
              Iniciar Sesión
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={4}>
          {features.map((f, i) => (
            <Grid size={{ xs: 12, md: 4 }} key={i}>
              <Box sx={{ textAlign: 'center', p: 4 }}>
                <Box sx={{ color: 'primary.main', mb: 2 }}>{f.icon}</Box>
                <Typography variant="h6" gutterBottom>{f.title}</Typography>
                <Typography variant="body2" color="text.secondary">{f.desc}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}
