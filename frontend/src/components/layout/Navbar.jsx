import { AppBar, Toolbar, Typography, Button, Box, IconButton } from '@mui/material'
import { useNavigate, useLocation } from 'react-router-dom'
import MovieIcon from '@mui/icons-material/Movie'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const isAdmin = location.pathname.startsWith('/admin')

  return (
    <AppBar position="sticky" elevation={1}>
      <Toolbar>
        <IconButton color="inherit" onClick={() => navigate('/')} sx={{ mr: 1 }}>
          <MovieIcon />
        </IconButton>
        <Typography variant="h6" sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => navigate('/')}>
          CineClub
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button color="inherit" onClick={() => navigate('/')}>
            Catálogo
          </Button>
          {user ? (
            <>
              {user.role === 'admin' && (
                <Button color="inherit" onClick={() => navigate('/admin')}>
                  Admin
                </Button>
              )}
              {user.role === 'employee' && (
                <Button color="inherit" onClick={() => navigate('/employee')}>
                  Mi Tienda
                </Button>
              )}
              <Button color="inherit" onClick={logout}>
                Salir
              </Button>
            </>
          ) : (
            !isAdmin && (
              <Button color="inherit" onClick={() => navigate('/login')}>
                Admin
              </Button>
            )
          )}
        </Box>
      </Toolbar>
    </AppBar>
  )
}
