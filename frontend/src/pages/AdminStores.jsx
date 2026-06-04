import { useState, useEffect, useCallback } from 'react'
import { Container, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import { getStores, createStore, updateStore, deleteStore } from '../services/api'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'

export default function AdminStores() {
  const [items, setItems] = useState([])
  const [dialog, setDialog] = useState(false)
  const [form, setForm] = useState({ name: '', address: '', phone: '' })
  const [editing, setEditing] = useState(null)

  const fetch = useCallback(async () => {
    const { data } = await getStores()
    setItems(data)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const handleSave = async () => {
    if (editing) { await updateStore(editing, form) } else { await createStore(form) }
    setDialog(false); setEditing(null); setForm({ name: '', address: '', phone: '' }); fetch()
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Tiendas</Typography>
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setForm({ name: '', address: '', phone: '' }); setDialog(true) }} sx={{ mb: 2 }}>Nueva tienda</Button>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead><TableRow><TableCell>Nombre</TableCell><TableCell>Dirección</TableCell><TableCell>Teléfono</TableCell><TableCell align="right">Acciones</TableCell></TableRow></TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item._id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.address}</TableCell>
                <TableCell>{item.phone}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => { setForm({ name: item.name, address: item.address || '', phone: item.phone || '' }); setEditing(item._id); setDialog(true) }}><EditIcon /></IconButton>
                  <IconButton onClick={async () => { if (window.confirm('¿Eliminar?')) { await deleteStore(item._id); fetch() } }} color="error"><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
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
    </Container>
  )
}
