import { Container, Box, Typography, TextField, Button, Paper, Alert } from '@mui/material'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { clientLogin } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await clientLogin(email, password)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión')
    }
  }

  return (
    <Container maxWidth="xs" sx={{ py: 8 }}>
      <Paper elevation={0} sx={{ p: 4, bgcolor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Typography variant="h5" gutterBottom align="center" sx={{ color: 'white' }}>
          Iniciar Sesión
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} margin="normal" required slotProps={{ inputLabel: { sx: { color: 'text.secondary' } }, input: { sx: { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' } } } }} />
          <TextField fullWidth label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} margin="normal" required slotProps={{ inputLabel: { sx: { color: 'text.secondary' } }, input: { sx: { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' } } } }} />
          <Button fullWidth type="submit" variant="contained" color="primary" size="large" sx={{ mt: 2 }}>
            Entrar
          </Button>
          <Typography variant="body2" align="center" sx={{ mt: 2, color: 'text.secondary' }}>
            ¿No tienes cuenta?{' '}
            <Link to="/registro" style={{ color: '#e50914', textDecoration: 'none' }}>Regístrate</Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}
