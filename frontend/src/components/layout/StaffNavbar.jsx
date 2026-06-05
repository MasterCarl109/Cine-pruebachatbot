import { AppBar, Toolbar, Typography, Button, Box, Chip } from '@mui/material'
import { useNavigate, useLocation } from 'react-router-dom'
import MovieIcon from '@mui/icons-material/Movie'
import { useAuth } from '../../context/AuthContext'
import { roleColors } from '../../theme'

const linksByRole = {
  admin: [
    { label: 'Dashboard', path: '/staff' },
    { label: 'Películas', path: '/staff/peliculas' },
    { label: 'Directores', path: '/staff/directores' },
    { label: 'Géneros', path: '/staff/generos' },
    { label: 'Tiendas', path: '/staff/tiendas' },
    { label: 'Usuarios', path: '/staff/usuarios' }
  ],
  manager: [
    { label: 'Dashboard', path: '/staff' },
    { label: 'Películas', path: '/staff/peliculas' },
    { label: 'Directores', path: '/staff/directores' },
    { label: 'Géneros', path: '/staff/generos' },
    { label: 'Tiendas', path: '/staff/tiendas' }
  ],
  employee: [
    { label: 'Mi Tienda', path: '/staff/empleado' }
  ]
}

export default function StaffNavbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const role = user?.role || 'employee'
  const roleColor = roleColors[role] || roleColors.employee
  const links = linksByRole[role] || []
  const storeName = user?.store?.name || ''

  return (
    <AppBar position="sticky" elevation={1} sx={{ bgcolor: roleColor.main }}>
      <Toolbar>
        <MovieIcon sx={{ mr: 1 }} />
        <Typography variant="h6" sx={{ cursor: 'pointer', mr: 3 }} onClick={() => navigate('/staff')}>
          CineClub
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flex: 1 }}>
          {links.map(l => (
            <Button
              key={l.path}
              color="inherit"
              size="small"
              onClick={() => navigate(l.path)}
              sx={{ opacity: location.pathname === l.path ? 1 : 0.8, borderBottom: location.pathname === l.path ? '2px solid white' : '2px solid transparent', borderRadius: 0 }}
            >
              {l.label}
            </Button>
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip
            label={`${roleColor.label}${storeName ? ` - ${storeName}` : ''}`}
            size="small"
            sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.2)', fontWeight: 600, backdropFilter: 'blur(4px)' }}
          />
          <Button color="inherit" size="small" onClick={logout}>
            Salir
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
