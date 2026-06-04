import { createTheme } from '@mui/material/styles'

const theme = createTheme({
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

export default theme
