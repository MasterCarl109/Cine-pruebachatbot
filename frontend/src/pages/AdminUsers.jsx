import { useState, useEffect, useCallback } from 'react'
import { Container, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, InputLabel, FormControl, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Switch, FormControlLabel } from '@mui/material'
import { getUsers, createUser, updateUser, deleteUser, getStores } from '../services/api'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'

const emptyForm = { email: '', password: '', name: '', role: 'employee', store: '' }

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [stores, setStores] = useState([])
  const [dialog, setDialog] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)

  const fetchData = useCallback(async () => {
    const [u, s] = await Promise.all([getUsers(), getStores()])
    setUsers(u.data)
    setStores(s.data)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSave = async () => {
    const payload = { ...form }
    if (payload.role === 'admin') delete payload.store
    if (editing) {
      const updates = { ...payload }
      if (!updates.password) delete updates.password
      await updateUser(editing, updates)
    } else {
      await createUser(payload)
    }
    setDialog(false)
    setEditing(null)
    setForm(emptyForm)
    fetchData()
  }

  const openEdit = (user) => {
    setForm({
      email: user.email,
      password: '',
      name: user.name || '',
      role: user.role,
      store: user.store?._id || ''
    })
    setEditing(user._id)
    setDialog(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este usuario?')) {
      try {
        await deleteUser(id)
        fetchData()
      } catch (err) {
        alert(err.response?.data?.error || 'Error al eliminar')
      }
    }
  }

  const toggleActive = async (user) => {
    await updateUser(user._id, { active: !user.active })
    fetchData()
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Usuarios</Typography>
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setForm(emptyForm); setDialog(true) }} sx={{ mb: 2 }}>
        Nuevo usuario
      </Button>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Tienda</TableCell>
              <TableCell>Activo</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u._id}>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.role}</TableCell>
                <TableCell>{u.store?.name || '—'}</TableCell>
                <TableCell>
                  <Switch checked={u.active} onChange={() => toggleActive(u)} size="small" />
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => openEdit(u)}><EditIcon /></IconButton>
                  <IconButton onClick={() => handleDelete(u._id)} color="error"><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} margin="dense" required />
          <TextField fullWidth label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} margin="dense" required />
          <TextField fullWidth label={editing ? 'Nueva contraseña (dejar vacío para mantener)' : 'Contraseña'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} margin="dense" type="password" required={!editing} />
          <FormControl fullWidth margin="dense">
            <InputLabel>Rol</InputLabel>
            <Select value={form.role} label="Rol" onChange={(e) => setForm({ ...form, role: e.target.value, store: e.target.value === 'admin' ? '' : form.store })}>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="manager">Manager</MenuItem>
              <MenuItem value="employee">Empleado</MenuItem>
            </Select>
          </FormControl>
          {form.role !== 'admin' && (
            <FormControl fullWidth margin="dense">
              <InputLabel>Tienda</InputLabel>
              <Select value={form.store} label="Tienda" onChange={(e) => setForm({ ...form, store: e.target.value })}>
                {stores.map((s) => <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>)}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>{editing ? 'Guardar' : 'Crear'}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
