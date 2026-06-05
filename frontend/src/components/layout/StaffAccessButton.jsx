import { Fab } from '@mui/material'
import BadgeIcon from '@mui/icons-material/Badge'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function StaffAccessButton() {
  const navigate = useNavigate()
  const { user } = useAuth()

  if (user) return null

  return (
    <Fab
      size="small"
      sx={{
        position: 'fixed', bottom: 20, left: 20, zIndex: 1200,
        bgcolor: 'rgba(255,255,255,0.08)', color: 'text.secondary',
        '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' }
      }}
      onClick={() => navigate('/access')}
      title="Acceso Personal"
    >
      <BadgeIcon sx={{ fontSize: 22 }} />
    </Fab>
  )
}
