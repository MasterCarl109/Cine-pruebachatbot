import { AppBar, Toolbar, Typography, Button, Box, Chip } from '@mui/material'
import { useNavigate, useLocation } from 'react-router-dom'
import MovieIcon from '@mui/icons-material/Movie'
import { useAuth } from '../../context/AuthContext'

export default function ClientNavbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  return (
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'rgba(20,20,20,0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid', borderColor: 'rgba(255,255,255,0.08)' }}>
      <Toolbar>
        <MovieIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography
          variant="h6" sx={{ flexGrow: 1, cursor: 'pointer', fontWeight: 700, letterSpacing: '-0.5px' }}
          onClick={() => navigate('/')}
        >
          CineClub
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            color="inherit"
            onClick={() => navigate('/catalogo')}
            sx={{ color: location.pathname === '/catalogo' ? 'primary.main' : 'text.secondary' }}
          >
            Catálogo
          </Button>
          {user ? (
            <>
              {user.role === 'client' && (
                <Button
                  color="inherit"
                  onClick={() => navigate('/mis-reservas')}
                  sx={{ color: location.pathname === '/mis-reservas' ? 'primary.main' : 'text.secondary' }}
                >
                  Mis Reservas
                </Button>
              )}
              <Chip
                label={user.name}
                size="small"
                sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)', fontWeight: 500 }}
              />
              <Button color="inherit" onClick={logout} sx={{ color: 'text.secondary' }}>
                Salir
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" onClick={() => navigate('/login')} sx={{ color: 'text.secondary' }}>
                Iniciar Sesión
              </Button>
              <Button variant="contained" color="primary" onClick={() => navigate('/registro')}>
                Registrarse
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  )
}
