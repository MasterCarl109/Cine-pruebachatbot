import { Box } from '@mui/material'
import Navbar from './Navbar'

export default function Layout({ children }) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Navbar />
      <Box component="main" sx={{ flex: 1 }}>
        {children}
      </Box>
    </Box>
  )
}
