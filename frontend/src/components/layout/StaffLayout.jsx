import { Box, ThemeProvider, CssBaseline } from '@mui/material'
import { Outlet } from 'react-router-dom'
import { staffTheme } from '../../theme'
import StaffNavbar from './StaffNavbar'

export default function StaffLayout() {
  return (
    <ThemeProvider theme={staffTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
        <StaffNavbar />
        <Box component="main" sx={{ flex: 1 }}>
          <Outlet />
        </Box>
      </Box>
    </ThemeProvider>
  )
}
