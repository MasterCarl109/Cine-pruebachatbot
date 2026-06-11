import { useState } from 'react'
import { Box, Typography, Button, IconButton, Chip, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, FormControl, InputLabel, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Switch, FormControlLabel } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import { addOffer, updateOffer, deleteOffer } from '../../services/api'

export default function OffersManager({ movie, stores, onUpdate }) {
  const [offerDialog, setOfferDialog] = useState(false)
  const [editingIdx, setEditingIdx] = useState(null)
  const [offerForm, setOfferForm] = useState({ store: '', description: '', discountPercent: '', startDate: '', endDate: '', active: true })

  const offers = movie?.offers || []

  const resetForm = () => {
    setOfferForm({ store: '', description: '', discountPercent: '', startDate: '', endDate: '', active: true })
    setEditingIdx(null)
  }

  const openAdd = () => {
    resetForm()
    setOfferDialog(true)
  }

  const openEdit = (idx) => {
    const o = offers[idx]
    setOfferForm({
      store: o.store?._id || '',
      description: o.description,
      discountPercent: String(o.discountPercent),
      startDate: o.startDate?.slice(0, 10) || '',
      endDate: o.endDate?.slice(0, 10) || '',
      active: o.active !== false
    })
    setEditingIdx(idx)
    setOfferDialog(true)
  }

  const handleSave = async () => {
    const payload = {
      store: offerForm.store || null,
      description: offerForm.description,
      discountPercent: Number(offerForm.discountPercent),
      startDate: new Date(offerForm.startDate),
      endDate: new Date(offerForm.endDate),
      active: offerForm.active
    }
    if (editingIdx !== null) {
      await updateOffer(movie._id, editingIdx, payload)
    } else {
      await addOffer(movie._id, payload)
    }
    setOfferDialog(false)
    resetForm()
    onUpdate()
  }

  const handleDelete = async (idx) => {
    if (window.confirm('¿Eliminar esta oferta?')) {
      await deleteOffer(movie._id, idx)
      onUpdate()
    }
  }

  const storeName = (storeId) => {
    if (!storeId) return 'Global'
    const s = stores.find(s => s._id === storeId)
    return s?.name || 'Global'
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2">Ofertas</Typography>
        <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={openAdd}>Agregar oferta</Button>
      </Box>

      {offers.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          No hay ofertas para esta película.
        </Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Tienda</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Dto%</TableCell>
                <TableCell>Inicio</TableCell>
                <TableCell>Fin</TableCell>
                <TableCell>Activa</TableCell>
                <TableCell align="right"></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {offers.map((o, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <Chip label={o.store?.name || 'Global'} size="small" variant="outlined" color={o.store ? 'primary' : 'default'} />
                  </TableCell>
                  <TableCell>{o.description}</TableCell>
                  <TableCell>{o.discountPercent}%</TableCell>
                  <TableCell>{new Date(o.startDate).toLocaleDateString('es-MX')}</TableCell>
                  <TableCell>{new Date(o.endDate).toLocaleDateString('es-MX')}</TableCell>
                  <TableCell>
                    <Chip label={o.active ? 'Sí' : 'No'} size="small" color={o.active ? 'success' : 'default'} />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(idx)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(idx)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={offerDialog} onClose={() => setOfferDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingIdx !== null ? 'Editar oferta' : 'Nueva oferta'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Descripción" value={offerForm.description} onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })} margin="dense" required />
          <TextField fullWidth label="Descuento (%)" type="number" value={offerForm.discountPercent} onChange={(e) => setOfferForm({ ...offerForm, discountPercent: e.target.value })} margin="dense" inputProps={{ min: 1, max: 100 }} required />
          <TextField fullWidth label="Fecha inicio" type="date" value={offerForm.startDate} onChange={(e) => setOfferForm({ ...offerForm, startDate: e.target.value })} margin="dense" slotProps={{ inputLabel: { shrink: true } }} required />
          <TextField fullWidth label="Fecha fin" type="date" value={offerForm.endDate} onChange={(e) => setOfferForm({ ...offerForm, endDate: e.target.value })} margin="dense" slotProps={{ inputLabel: { shrink: true } }} required />
          <FormControl fullWidth margin="dense">
            <InputLabel>Tienda (opcional)</InputLabel>
            <Select value={offerForm.store} label="Tienda (opcional)" onChange={(e) => setOfferForm({ ...offerForm, store: e.target.value })}>
              <MenuItem value="">Global (todas las tiendas)</MenuItem>
              {stores.map((s) => <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControlLabel control={<Switch checked={offerForm.active} onChange={(e) => setOfferForm({ ...offerForm, active: e.target.checked })} />} label="Oferta activa" sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOfferDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>{editingIdx !== null ? 'Guardar' : 'Crear'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
