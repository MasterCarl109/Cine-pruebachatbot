import { useState, useEffect, useRef, useCallback } from 'react'
import { Fab, Paper, TextField, IconButton, Typography, Box, Avatar, Button } from '@mui/material'
import ChatIcon from '@mui/icons-material/Chat'
import CloseIcon from '@mui/icons-material/Close'
import SendIcon from '@mui/icons-material/Send'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import PersonIcon from '@mui/icons-material/Person'
import SupportAgentIcon from '@mui/icons-material/SupportAgent'
import socket, { setSocketToken } from '../../services/socket'
import { getClientSocketToken } from '../../services/api'

const darkBg = '#1a1a2e'
const chatBg = '#16213e'
const botBubble = '#2a2a3e'
const userBubble = '#e50914'
const managerBubble = '#2e7d32'

export default function ChatWidget({ onOpenChange }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [chatMode, setChatMode] = useState('bot')
  const [sessionId, setSessionId] = useState(null)
  const endRef = useRef(null)

  const toggleOpen = () => {
    const next = !open
    setOpen(next)
    onOpenChange?.(next)
  }

  const addMessage = useCallback((from, text) => {
    setMessages((prev) => [...prev, { from, text }])
  }, [])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, typing])

  useEffect(() => {
    if (open) initSocketToken()
  }, [open])

  const initSocketToken = useCallback(async () => {
    try {
      const { data } = await getClientSocketToken()
      if (data?.token) {
        setSocketToken(data.token)
        return true
      }
    } catch { /* no session */ }
    return false
  }, [])

  useEffect(() => {
    initSocketToken()

    const handleResponse = ({ message }) => addMessage('bot', message)
    const handleTyping = ({ typing: t }) => setTyping(t)
    const handleTransfer = ({ sessionId: sid }) => {
      setSessionId(sid)
      addMessage('bot', 'Un gerente se conectará contigo en breve. Por favor espera...')
    }
    const handleAccepted = ({ sessionId: sid, managerName }) => {
      setSessionId(sid)
      setChatMode('manager')
      addMessage('system', `Conectado con ${managerName}`)
    }
    const handleManagerMsg = ({ text }) => {
      addMessage('manager', text)
    }
    const handleClosed = ({ reason }) => {
      addMessage('system', reason || 'La conversación ha terminado.')
      setChatMode('bot')
      setSessionId(null)
    }
    const handleError = ({ message }) => {
      addMessage('system', `Error: ${message}`)
    }
    const handleConnectError = async (err) => {
      if (err.message?.includes('Sesión') || err.message?.includes('autenticación')) {
        try {
          const { data } = await getClientSocketToken()
          if (data?.token) setSocketToken(data.token)
        } catch {
          socket.disconnect()
        }
      }
    }

    socket.on('bot_response', handleResponse)
    socket.on('bot_typing', handleTyping)
    socket.on('chat_transfer_offered', handleTransfer)
    socket.on('chat_accepted', handleAccepted)
    socket.on('manager_message', handleManagerMsg)
    socket.on('chat_closed', handleClosed)
    socket.on('chat_error', handleError)
    socket.on('connect_error', handleConnectError)

    return () => {
      socket.off('bot_response', handleResponse)
      socket.off('bot_typing', handleTyping)
      socket.off('chat_transfer_offered', handleTransfer)
      socket.off('chat_accepted', handleAccepted)
      socket.off('manager_message', handleManagerMsg)
      socket.off('chat_closed', handleClosed)
      socket.off('chat_error', handleError)
      socket.off('connect_error', handleConnectError)
      socket.disconnect()
    }
  }, [])

  const handleSend = () => {
    if (!input.trim()) return
    const text = input
    setInput('')

    if (chatMode === 'manager' && sessionId) {
      addMessage('user', text)
      socket.emit('client_send_message', { sessionId, text })
    } else {
      addMessage('user', text)
      socket.emit('send_message', { message: text })
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const headerIcon = chatMode === 'manager' ? <SupportAgentIcon /> : <SmartToyIcon />
  const headerTitle = chatMode === 'manager' ? 'Atención al cliente' : 'Asistente CineClub'

  return (
    <>
      {open && (
        <Paper elevation={8} sx={{ position: 'fixed', bottom: 80, right: 20, width: 360, height: 500, display: 'flex', flexDirection: 'column', borderRadius: 3, overflow: 'hidden', zIndex: 1200, bgcolor: darkBg, border: '1px solid rgba(255,255,255,0.08)' }}>
          <Box sx={{ bgcolor: chatMode === 'manager' ? 'success.dark' : 'primary.main', color: 'white', p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            {headerIcon}
            <Typography variant="subtitle1" sx={{ flex: 1 }}>{headerTitle}</Typography>
            <IconButton size="small" color="inherit" onClick={() => { setOpen(false); onOpenChange?.(false) }}><CloseIcon /></IconButton>
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: chatBg, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {messages.length === 0 && (
              <Typography variant="body2" sx={{ textAlign: 'center', mt: 4, color: 'rgba(255,255,255,0.5)' }}>
                ¡Hola! Pregúntame sobre nuestro catálogo de películas.
              </Typography>
            )}
            {messages.map((msg, i) => {
              const isUser = msg.from === 'user'
              const isManager = msg.from === 'manager'
              const isSystem = msg.from === 'system'
              const bgColor = isUser ? userBubble : isManager ? managerBubble : isSystem ? 'rgba(255,255,255,0.1)' : botBubble
              const Icon = isUser ? PersonIcon : isManager ? SupportAgentIcon : SmartToyIcon
              return (
                <Box key={i} sx={{ display: 'flex', gap: 1, alignSelf: isUser ? 'flex-end' : 'flex-start', flexDirection: isUser ? 'row-reverse' : 'row', maxWidth: '80%' }}>
                  {!isSystem && (
                    <Avatar sx={{ width: 28, height: 28, bgcolor: isUser ? userBubble : isManager ? managerBubble : 'primary.main' }}>
                      <Icon sx={{ fontSize: 16 }} />
                    </Avatar>
                  )}
                  <Paper elevation={1} sx={{ p: 1.5, borderRadius: 3, bgcolor: bgColor, color: 'white', fontStyle: isSystem ? 'italic' : 'normal', fontSize: isSystem ? '0.8rem' : 'inherit' }}>
                    <Typography variant="body2">{msg.text}</Typography>
                  </Paper>
                </Box>
              )
            })}
            {typing && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main' }}><SmartToyIcon sx={{ fontSize: 16 }} /></Avatar>
                <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.5)' }}>Escribiendo...</Typography>
              </Box>
            )}
            <div ref={endRef} />
          </Box>

          <Box sx={{ p: 2, bgcolor: darkBg, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 1 }}>
            <TextField
              fullWidth size="small"
              placeholder="Escribe un mensaje..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              slotProps={{
                input: {
                  sx: { color: 'white', bgcolor: chatBg, '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' } }
                }
              }}
            />
            <IconButton color="primary" onClick={handleSend}><SendIcon /></IconButton>
          </Box>
        </Paper>
      )}
      <Fab color={chatMode === 'manager' ? 'success' : 'primary'} sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1200 }} onClick={toggleOpen}>
        {open ? <CloseIcon /> : chatMode === 'manager' ? <SupportAgentIcon /> : <ChatIcon />}
      </Fab>
    </>
  )
}
