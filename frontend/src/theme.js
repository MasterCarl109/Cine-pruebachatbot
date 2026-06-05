import { createTheme } from '@mui/material/styles'

const staffTheme = createTheme({
  palette: {
    primary: { main: '#1565c0' },
    secondary: { main: '#f50057' },
    background: { default: '#f5f5f5' }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 }
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: { root: { textTransform: 'none', fontWeight: 500 } }
    },
    MuiCard: {
      styleOverrides: { root: { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' } }
    }
  }
})

const clientTheme = createTheme({
  palette: {
    primary: { main: '#e50914', light: '#ff1a25' },
    secondary: { main: '#f5c518', light: '#ffd73d' },
    background: { default: '#141414', paper: '#1a1a2e' },
    text: { primary: '#ffffff', secondary: '#b3b3b3' }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 }
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: { root: { textTransform: 'none', fontWeight: 600, borderRadius: 6 } }
    },
    MuiCard: {
      styleOverrides: { root: { backgroundColor: '#1a1a2e', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' } }
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 500 } }
    }
  }
})

const roleColors = {
  admin: { main: '#d32f2f', light: '#ef5350', label: 'Admin' },
  manager: { main: '#1565c0', light: '#42a5f5', label: 'Manager' },
  employee: { main: '#00897b', light: '#26a69a', label: 'Empleado' },
  client: { main: '#e50914', light: '#ff1a25', label: 'Cliente' }
}

export { staffTheme, clientTheme, roleColors }
export default staffTheme
