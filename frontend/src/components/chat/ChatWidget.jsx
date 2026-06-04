import { useState, useEffect, useRef } from 'react'
import { Fab, Paper, TextField, IconButton, Typography, Box, Avatar } from '@mui/material'
import ChatIcon from '@mui/icons-material/Chat'
import CloseIcon from '@mui/icons-material/Close'
import SendIcon from '@mui/icons-material/Send'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import PersonIcon from '@mui/icons-material/Person'
import socket from '../../services/socket'

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const endRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, typing])

  useEffect(() => {
    socket.connect()
    const handleResponse = ({ message }) => setMessages((prev) => [...prev, { from: 'bot', text: message }])
    const handleTyping = ({ typing: t }) => setTyping(t)
    socket.on('bot_response', handleResponse)
    socket.on('bot_typing', handleTyping)
    return () => {
      socket.off('bot_response', handleResponse)
      socket.off('bot_typing', handleTyping)
      socket.disconnect()
    }
  }, [])

  const handleSend = () => {
    if (!input.trim()) return
    setMessages((prev) => [...prev, { from: 'user', text: input }])
    socket.emit('send_message', { message: input })
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <>
      {open && (
        <Paper elevation={8} sx={{ position: 'fixed', bottom: 80, right: 20, width: 360, height: 500, display: 'flex', flexDirection: 'column', borderRadius: 3, overflow: 'hidden', zIndex: 1200 }}>
          <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <SmartToyIcon />
            <Typography variant="subtitle1" sx={{ flex: 1 }}>Asistente CineClub</Typography>
            <IconButton size="small" color="inherit" onClick={() => setOpen(false)}><CloseIcon /></IconButton>
          </Box>
          <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: '#f8f9fa', display: 'flex', flexDirection: 'column', gap: 1 }}>
            {messages.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                ¡Hola! Pregúntame sobre nuestro catálogo de películas.
              </Typography>
            )}
            {messages.map((msg, i) => (
              <Box key={i} sx={{ display: 'flex', gap: 1, alignSelf: msg.from === 'user' ? 'flex-end' : 'flex-start', flexDirection: msg.from === 'user' ? 'row-reverse' : 'row', maxWidth: '80%' }}>
                <Avatar sx={{ width: 28, height: 28, bgcolor: msg.from === 'user' ? 'secondary.main' : 'primary.main' }}>
                  {msg.from === 'user' ? <PersonIcon sx={{ fontSize: 16 }} /> : <SmartToyIcon sx={{ fontSize: 16 }} />}
                </Avatar>
                <Paper elevation={1} sx={{ p: 1.5, borderRadius: 3, bgcolor: msg.from === 'user' ? 'secondary.main' : 'white', color: msg.from === 'user' ? 'white' : 'text.primary' }}>
                  <Typography variant="body2">{msg.text}</Typography>
                </Paper>
              </Box>
            ))}
            {typing && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main' }}><SmartToyIcon sx={{ fontSize: 16 }} /></Avatar>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>Escribiendo...</Typography>
              </Box>
            )}
            <div ref={endRef} />
          </Box>
          <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1 }}>
            <TextField fullWidth size="small" placeholder="Escribe un mensaje..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} />
            <IconButton color="primary" onClick={handleSend}><SendIcon /></IconButton>
          </Box>
        </Paper>
      )}
      <Fab color="primary" sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1200 }} onClick={() => setOpen(!open)}>
        {open ? <CloseIcon /> : <ChatIcon />}
      </Fab>
    </>
  )
}
