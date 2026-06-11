import { useState, useEffect, useCallback } from 'react'
import { Container, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Chip } from '@mui/material'
import { getStores, createStore, updateStore, deleteStore, addRoom, updateRoom, deleteRoom } from '../services/api'
import { useAuth } from '../context/AuthContext'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'

export default function AdminStores() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [items, setItems] = useState([])
  const [dialog, setDialog] = useState(false)
  const [form, setForm] = useState({ name: '', address: '', phone: '' })
  const [editing, setEditing] = useState(null)
  const [roomDialog, setRoomDialog] = useState(false)
  const [roomForm, setRoomForm] = useState({ name: '', capacity: '' })
  const [editingRoom, setEditingRoom] = useState(null)
  const [selectedStore, setSelectedStore] = useState(null)

  const fetch = useCallback(async () => {
    const { data } = await getStores()
    if (isAdmin) {
      setItems(data)
    } else {
      const userStoreId = user?.store?._id || user?.store
      setItems(data.filter(s => String(s._id) === String(userStoreId)))
    }
  }, [isAdmin, user])

  useEffect(() => { fetch() }, [fetch])

  const handleSave = async () => {
    if (editing) { await updateStore(editing, form) } else { await createStore(form) }
    setDialog(false); setEditing(null); setForm({ name: '', address: '', phone: '' }); fetch()
  }

  const openRoomDialog = (store, room = null) => {
    setSelectedStore(store)
    if (room) {
      setRoomForm({ name: room.name, capacity: String(room.capacity) })
      setEditingRoom(room._id)
    } else {
      setRoomForm({ name: '', capacity: '' })
      setEditingRoom(null)
    }
    setRoomDialog(true)
  }

  const handleRoomSave = async () => {
    if (!selectedStore) return
    const data = { name: roomForm.name, capacity: Number(roomForm.capacity) }
    if (editingRoom) {
      await updateRoom(selectedStore._id, editingRoom, data)
    } else {
      await addRoom(selectedStore._id, data)
    }
    setRoomDialog(false)
    setEditingRoom(null)
    setRoomForm({ name: '', capacity: '' })
    fetch()
  }

  const handleDeleteRoom = async (storeId, roomId) => {
    if (window.confirm('¿Eliminar esta sala?')) {
      await deleteRoom(storeId, roomId)
      fetch()
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>{isAdmin ? 'Tiendas' : 'Mi Tienda'}</Typography>
      {isAdmin && (
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setForm({ name: '', address: '', phone: '' }); setDialog(true) }} sx={{ mb: 2 }}>Nueva tienda</Button>
      )}

      {items.map((item) => (
        <Paper key={item._id} sx={{ mb: 3, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box>
              <Typography variant="h6">{item.name}</Typography>
              <Typography variant="body2" color="text.secondary">{item.address} &middot; {item.phone}</Typography>
            </Box>
            <Box>
              {isAdmin && (
                <>
                  <IconButton onClick={() => { setForm({ name: item.name, address: item.address || '', phone: item.phone || '' }); setEditing(item._id); setDialog(true) }}><EditIcon /></IconButton>
                  <IconButton onClick={async () => { if (window.confirm('¿Eliminar tienda?')) { await deleteStore(item._id); fetch() } }} color="error"><DeleteIcon /></IconButton>
                </>
              )}
            </Box>
          </Box>

          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <MeetingRoomIcon fontSize="small" /> Salas ({item.rooms?.length || 0}/5)
          </Typography>

          <TableContainer component={Paper} variant="outlined" sx={{ mb: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Sala</TableCell>
                  <TableCell>Capacidad</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(item.rooms || []).map((room) => (
                  <TableRow key={room._id}>
                    <TableCell>{room.name}</TableCell>
                    <TableCell><Chip label={`${room.capacity} asientos`} size="small" variant="outlined" /></TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openRoomDialog(item, room)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteRoom(item._id, room._id)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {(!item.rooms || item.rooms.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={3} align="center"><Typography variant="body2" color="text.secondary">Sin salas registradas</Typography></TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {(item.rooms?.length || 0) < 5 && (
            <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => openRoomDialog(item)}>
              Agregar sala
            </Button>
          )}
        </Paper>
      ))}

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Editar tienda' : 'Nueva tienda'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} margin="dense" required />
          <TextField fullWidth label="Dirección" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} margin="dense" />
          <TextField fullWidth label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} margin="dense" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>{editing ? 'Guardar' : 'Crear'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={roomDialog} onClose={() => setRoomDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editingRoom ? 'Editar sala' : `Nueva sala - ${selectedStore?.name}`}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Nombre de sala" value={roomForm.name} onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })} margin="dense" required placeholder="Ej: Sala 1" />
          <TextField fullWidth label="Capacidad" type="number" value={roomForm.capacity} onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })} margin="dense" required slotProps={{ htmlInput: { min: 1 } }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoomDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleRoomSave}>{editingRoom ? 'Guardar' : 'Crear'}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
