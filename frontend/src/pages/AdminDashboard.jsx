import { Container, Grid, Paper, Typography, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import MovieIcon from '@mui/icons-material/Movie'
import PersonIcon from '@mui/icons-material/Person'
import CategoryIcon from '@mui/icons-material/Category'
import StoreIcon from '@mui/icons-material/Store'
import GroupIcon from '@mui/icons-material/Group'
import { useAuth } from '../context/AuthContext'

const adminCards = [
  { label: 'Películas', icon: <MovieIcon sx={{ fontSize: 48 }} />, path: '/admin/movies', color: '#1565c0' },
  { label: 'Directores', icon: <PersonIcon sx={{ fontSize: 48 }} />, path: '/admin/directors', color: '#2e7d32' },
  { label: 'Géneros', icon: <CategoryIcon sx={{ fontSize: 48 }} />, path: '/admin/genres', color: '#ed6c02' },
  { label: 'Tiendas', icon: <StoreIcon sx={{ fontSize: 48 }} />, path: '/admin/stores', color: '#9c27b0' },
  { label: 'Usuarios', icon: <GroupIcon sx={{ fontSize: 48 }} />, path: '/admin/users', color: '#e91e63' }
]

const managerCards = [
  { label: 'Películas', icon: <MovieIcon sx={{ fontSize: 48 }} />, path: '/admin/movies', color: '#1565c0' },
  { label: 'Directores', icon: <PersonIcon sx={{ fontSize: 48 }} />, path: '/admin/directors', color: '#2e7d32' },
  { label: 'Géneros', icon: <CategoryIcon sx={{ fontSize: 48 }} />, path: '/admin/genres', color: '#ed6c02' },
  { label: 'Tiendas', icon: <StoreIcon sx={{ fontSize: 48 }} />, path: '/admin/stores', color: '#9c27b0' }
]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const cards = user?.role === 'admin' ? adminCards : managerCards

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Panel de Administración</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Bienvenido, {user?.name || user?.email}
      </Typography>
      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={card.path}>
            <Paper
              elevation={2}
              sx={{ p: 3, textAlign: 'center', cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }}
              onClick={() => navigate(card.path)}
            >
              <Typography color={card.color}>{card.icon}</Typography>
              <Typography variant="h6" sx={{ mt: 1 }}>{card.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
      <Button variant="outlined" color="error" onClick={logout} sx={{ mt: 3 }}>
        Cerrar sesión
      </Button>
    </Container>
  )
}
