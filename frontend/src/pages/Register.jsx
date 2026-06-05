import { Container, Box, Typography, TextField, Button, Paper, Alert } from '@mui/material'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register as apiRegister } from '../services/api'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await apiRegister(email, password, name)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse')
    }
  }

  return (
    <Container maxWidth="xs" sx={{ py: 8 }}>
      <Paper elevation={0} sx={{ p: 4, bgcolor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Typography variant="h5" gutterBottom align="center" sx={{ color: 'white' }}>
          Crear Cuenta
        </Typography>
        {success ? (
          <Alert severity="success" sx={{ mb: 2 }}>Cuenta creada. Redirigiendo al inicio de sesión...</Alert>
        ) : (
          <Box component="form" onSubmit={handleSubmit}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField fullWidth label="Nombre" value={name} onChange={(e) => setName(e.target.value)} margin="normal" required slotProps={{ inputLabel: { sx: { color: 'text.secondary' } }, input: { sx: { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' } } } }} />
            <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} margin="normal" required slotProps={{ inputLabel: { sx: { color: 'text.secondary' } }, input: { sx: { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' } } } }} />
            <TextField fullWidth label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} margin="normal" required slotProps={{ inputLabel: { sx: { color: 'text.secondary' } }, input: { sx: { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' } } } }} />
            <Button fullWidth type="submit" variant="contained" color="primary" size="large" sx={{ mt: 2 }}>
              Registrarse
            </Button>
            <Typography variant="body2" align="center" sx={{ mt: 2, color: 'text.secondary' }}>
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" style={{ color: '#e50914', textDecoration: 'none' }}>Inicia sesión</Link>
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  )
}
