import { useState, useEffect, useCallback } from 'react'
import { Container, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import { getDirectors, createDirector, updateDirector, deleteDirector } from '../services/api'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'

export default function AdminDirectors() {
  const [items, setItems] = useState([])
  const [dialog, setDialog] = useState(false)
  const [form, setForm] = useState({ name: '', nationality: '', biography: '' })
  const [editing, setEditing] = useState(null)

  const fetch = useCallback(async () => {
    const { data } = await getDirectors()
    setItems(data)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const handleSave = async () => {
    if (editing) { await updateDirector(editing, form) } else { await createDirector(form) }
    setDialog(false); setEditing(null); setForm({ name: '', nationality: '', biography: '' }); fetch()
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Directores</Typography>
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setForm({ name: '', nationality: '', biography: '' }); setDialog(true) }} sx={{ mb: 2 }}>Nuevo director</Button>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead><TableRow><TableCell>Nombre</TableCell><TableCell>Nacionalidad</TableCell><TableCell align="right">Acciones</TableCell></TableRow></TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item._id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.nationality}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => { setForm({ name: item.name, nationality: item.nationality || '', biography: item.biography || '' }); setEditing(item._id); setDialog(true) }}><EditIcon /></IconButton>
                  <IconButton onClick={async () => { if (window.confirm('¿Eliminar?')) { await deleteDirector(item._id); fetch() } }} color="error"><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Editar director' : 'Nuevo director'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} margin="dense" required />
          <TextField fullWidth label="Nacionalidad" value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} margin="dense" />
          <TextField fullWidth label="Biografía" value={form.biography} onChange={(e) => setForm({ ...form, biography: e.target.value })} margin="dense" multiline rows={3} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>{editing ? 'Guardar' : 'Crear'}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
