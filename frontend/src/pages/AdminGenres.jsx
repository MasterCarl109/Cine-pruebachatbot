import { useState, useEffect, useCallback } from 'react'
import { Container, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import { getGenres, createGenre, updateGenre, deleteGenre } from '../services/api'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'

export default function AdminGenres() {
  const [items, setItems] = useState([])
  const [dialog, setDialog] = useState(false)
  const [form, setForm] = useState({ name: '' })
  const [editing, setEditing] = useState(null)

  const fetch = useCallback(async () => {
    const { data } = await getGenres()
    setItems(data)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const handleSave = async () => {
    if (editing) { await updateGenre(editing, form) } else { await createGenre(form) }
    setDialog(false); setEditing(null); setForm({ name: '' }); fetch()
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Géneros</Typography>
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setForm({ name: '' }); setDialog(true) }} sx={{ mb: 2 }}>Nuevo género</Button>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead><TableRow><TableCell>Nombre</TableCell><TableCell align="right">Acciones</TableCell></TableRow></TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item._id}>
                <TableCell>{item.name}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => { setForm({ name: item.name }); setEditing(item._id); setDialog(true) }}><EditIcon /></IconButton>
                  <IconButton onClick={async () => { if (window.confirm('¿Eliminar?')) { await deleteGenre(item._id); fetch() } }} color="error"><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? 'Editar género' : 'Nuevo género'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Nombre" value={form.name} onChange={(e) => setForm({ name: e.target.value })} margin="dense" required />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>{editing ? 'Guardar' : 'Crear'}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
