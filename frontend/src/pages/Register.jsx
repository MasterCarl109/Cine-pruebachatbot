import { Container, Box, Typography, TextField, Button, Paper, Alert } from '@mui/material'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { clientRegister } from '../services/api'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [cardNumber, setCardNumber] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!/^\d{6}$/.test(pin)) {
      setError('El PIN debe tener exactamente 6 dígitos')
      return
    }
    try {
      const { data } = await clientRegister(email, password, name, pin)
      setCardNumber(data.cardNumber)
      setSuccess(true)
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
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>Cuenta creada exitosamente</Alert>
            <Paper sx={{ p: 3, bgcolor: '#16213e', border: '1px solid rgba(255,255,255,0.08)', mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Tu número de tarjeta virtual
              </Typography>
              <Typography variant="h6" sx={{ fontFamily: 'monospace', letterSpacing: 2, color: 'primary.main' }}>
                {cardNumber}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Guárdalo en un lugar seguro. Lo necesitarás para identificar tu tarjeta.
              </Typography>
            </Paper>
            <Button fullWidth variant="contained" color="primary" onClick={() => navigate('/login')}>
              Ir a Iniciar Sesión
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField fullWidth label="Nombre" value={name} onChange={(e) => setName(e.target.value)} margin="normal" required slotProps={{ inputLabel: { sx: { color: 'text.secondary' } }, input: { sx: { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' } } } }} />
            <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} margin="normal" required slotProps={{ inputLabel: { sx: { color: 'text.secondary' } }, input: { sx: { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' } } } }} />
            <TextField fullWidth label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} margin="normal" required slotProps={{ inputLabel: { sx: { color: 'text.secondary' } }, input: { sx: { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' } } } }} />
            <TextField fullWidth label="PIN de tarjeta (6 dígitos)" type="password" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} margin="normal" required slotProps={{ inputLabel: { sx: { color: 'text.secondary' } }, input: { sx: { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' } } }, htmlInput: { maxLength: 6, inputMode: 'numeric' } }} />
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
