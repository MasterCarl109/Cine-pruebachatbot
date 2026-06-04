import { Container, Box, Typography, TextField, Button, Paper, Alert } from '@mui/material'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('admin@cineclub.com')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión')
    }
  }

  return (
    <Container maxWidth="xs" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom align="center">
          Admin CineClub
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} margin="normal" required />
          <TextField fullWidth label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} margin="normal" required />
          <Button fullWidth type="submit" variant="contained" size="large" sx={{ mt: 2 }}>
            Iniciar sesión
          </Button>
        </Box>
      </Paper>
    </Container>
  )
}
