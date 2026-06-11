import { useState, useEffect, useRef, useCallback } from 'react'
import { Box, Paper, Typography, List, ListItemButton, ListItemText, TextField, IconButton, Avatar, Chip, CircularProgress } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import PersonIcon from '@mui/icons-material/Person'
import SupportAgentIcon from '@mui/icons-material/SupportAgent'
import CloseIcon from '@mui/icons-material/Close'
import { getChatSessions, getChatSession, getStaffSocketToken } from '../../services/api'
import managerSocket, { setManagerSocketToken } from '../../services/managerSocket'
import { useAuth } from '../../context/AuthContext'

export default function ManagerChat() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const endRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const fetchSessions = useCallback(async () => {
    try {
      const { data } = await getChatSessions()
      setSessions(data)
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()

    ;(async () => {
      try {
        const { data } = await getStaffSocketToken()
        if (data?.token) {
          setManagerSocketToken(data.token)
          managerSocket.emit('manager_join')
        }
      } catch {
        setManagerSocketToken(null)
      }
    })()

    const handleNewRequest = (data) => {
      setSessions(prev => {
        const exists = prev.find(s => String(s._id) === String(data.sessionId))
        if (exists) return prev
        const newSession = { _id: data.sessionId, client: { name: data.clientName, email: data.clientEmail }, status: 'waiting', createdAt: data.createdAt }
        return [newSession, ...prev]
      })
    }

    const handleChatConnected = (data) => {
      setActiveSession(data.sessionId)
      setMessages(data.messages || [])
      setSessions(prev => prev.map(s => s._id === data.sessionId ? { ...s, status: 'active' } : s))
    }

    const handleClientMessage = (data) => {
      setMessages(prev => [...prev, { from: 'client', text: data.text }])
    }

    const handleChatSent = (data) => {
      setMessages(prev => [...prev, { from: 'manager', text: data.text }])
    }

    const handleUpdated = (data) => {
      setSessions(prev => prev.map(s => s._id === data.sessionId ? { ...s, status: data.status } : s))
    }

    const handleConnectError = async (err) => {
      if (err.message?.includes('Sesión') || err.message?.includes('autenticación')) {
        try {
          const { data } = await getStaffSocketToken()
          if (data?.token) {
            setManagerSocketToken(data.token)
            managerSocket.emit('manager_join')
          }
        } catch {
          managerSocket.disconnect()
        }
      }
    }

    managerSocket.on('new_chat_request', handleNewRequest)
    managerSocket.on('chat_connected', handleChatConnected)
    managerSocket.on('client_message', handleClientMessage)
    managerSocket.on('chat_message_sent', handleChatSent)
    managerSocket.on('chat_request_updated', handleUpdated)
    managerSocket.on('connect_error', handleConnectError)

    return () => {
      managerSocket.off('new_chat_request', handleNewRequest)
      managerSocket.off('chat_connected', handleChatConnected)
      managerSocket.off('client_message', handleClientMessage)
      managerSocket.off('chat_message_sent', handleChatSent)
      managerSocket.off('chat_request_updated', handleUpdated)
      managerSocket.off('connect_error', handleConnectError)
    }
  }, [user, fetchSessions])

  const handleSelectSession = async (sessionId) => {
    if (activeSession === sessionId) {
      setActiveSession(null)
      setMessages([])
      return
    }
    try {
      const { data } = await getChatSession(sessionId)
      setMessages(data.messages || [])
      setActiveSession(sessionId)

      if (data.status === 'waiting') {
        managerSocket.emit('manager_accept_chat', { sessionId })
      }
    } catch { /* ignore */ }
  }

  const handleSend = () => {
    if (!input.trim() || !activeSession) return
    const text = input
    setInput('')
    managerSocket.emit('manager_send_message', { sessionId: activeSession, text })
  }

  const handleClose = () => {
    if (!activeSession) return
    managerSocket.emit('manager_close_chat', { sessionId: activeSession })
    setActiveSession(null)
    setMessages([])
  }

  const waitingCount = sessions.filter(s => s.status === 'waiting').length
  const sessionList = sessions.filter(s => s.status !== 'closed')

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>

  return (
    <Box sx={{ display: 'flex', gap: 2, height: 'calc(100vh - 160px)', minHeight: 400 }}>
      <Paper sx={{ width: 300, flexShrink: 0, borderRadius: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
          <SupportAgentIcon />
          <Typography variant="h6" sx={{ flex: 1 }}>Chat en vivo</Typography>
          {waitingCount > 0 && (
            <Chip label={`${waitingCount} esperando`} color="error" size="small" />
          )}
        </Box>
        <List sx={{ flex: 1, overflow: 'auto', bgcolor: 'background.paper' }}>
          {sessionList.length === 0 && (
            <Typography variant="body2" sx={{ p: 2, color: 'text.secondary', textAlign: 'center' }}>
              No hay solicitudes de chat activas.
            </Typography>
          )}
          {sessionList.map(s => (
            <ListItemButton
              key={s._id}
              selected={activeSession === s._id}
              onClick={() => handleSelectSession(s._id)}
              sx={{ '&.Mui-selected': { bgcolor: 'action.selected' } }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {s.client?.name || 'Cliente'}
                    {s.status === 'waiting' && (
                      <Chip label="Nuevo" color="error" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                    )}
                    {s.status === 'active' && (
                      <Chip label="Activo" color="success" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                    )}
                  </Box>
                }
                secondary={s.client?.email || ''}
              />
            </ListItemButton>
          ))}
        </List>
      </Paper>

      <Paper sx={{ flex: 1, borderRadius: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {!activeSession ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'text.secondary' }}>
            <Typography>Selecciona una conversación</Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}><PersonIcon sx={{ fontSize: 18 }} /></Avatar>
              <Typography sx={{ flex: 1 }} color="text.primary">
                {sessions.find(s => s._id === activeSession)?.client?.name || 'Cliente'}
              </Typography>
              <IconButton size="small" color="error" onClick={handleClose}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: 'grey.50', display: 'flex', flexDirection: 'column', gap: 1 }}>
              {messages.map((msg, i) => {
                const isManager = msg.from === 'manager'
                const isSystem = msg.from === 'system'
                return (
                  <Box key={i} sx={{ display: 'flex', gap: 1, alignSelf: isManager ? 'flex-end' : 'flex-start', flexDirection: isManager ? 'row-reverse' : 'row', maxWidth: '80%' }}>
                    {!isSystem && (
                      <Avatar sx={{ width: 28, height: 28, bgcolor: isManager ? 'success.light' : 'primary.main' }}>
                        {isManager ? <SupportAgentIcon sx={{ fontSize: 16 }} /> : <PersonIcon sx={{ fontSize: 16 }} />}
                      </Avatar>
                    )}
                    <Paper elevation={1} sx={{ p: 1.5, borderRadius: 3, bgcolor: isManager ? 'success.light' : isSystem ? 'grey.100' : 'background.paper', color: isSystem ? 'text.secondary' : 'text.primary', fontStyle: isSystem ? 'italic' : 'normal', fontSize: isSystem ? '0.8rem' : 'inherit' }}>
                      <Typography variant="body2">{msg.text}</Typography>
                    </Paper>
                  </Box>
                )
              })}
              <div ref={endRef} />
            </Box>

            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
              <TextField
                fullWidth size="small"
                placeholder="Escribe un mensaje..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              />
              <IconButton color="primary" onClick={handleSend}><SendIcon /></IconButton>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  )
}
