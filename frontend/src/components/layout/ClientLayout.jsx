import { useState, useCallback } from 'react'
import { Box, ThemeProvider, CssBaseline } from '@mui/material'
import { Outlet } from 'react-router-dom'
import { clientTheme } from '../../theme'
import ClientNavbar from './ClientNavbar'
import ChatWidget from '../chat/ChatWidget'
import WhatsAppButton from './WhatsAppButton'
import StaffAccessButton from './StaffAccessButton'

export default function ClientLayout() {
  const [chatOpen, setChatOpen] = useState(false)

  const handleChatOpenChange = useCallback((open) => setChatOpen(open), [])

  return (
    <ThemeProvider theme={clientTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
        <ClientNavbar />
        <Box component="main" sx={{ flex: 1 }}>
          <Outlet />
        </Box>
        <ChatWidget onOpenChange={handleChatOpenChange} />
        {!chatOpen && <WhatsAppButton />}
        <StaffAccessButton />
      </Box>
    </ThemeProvider>
  )
}
