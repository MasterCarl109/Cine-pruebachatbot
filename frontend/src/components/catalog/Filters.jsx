import { useState, useEffect } from 'react'
import { Stack, TextField, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material'
import { getGenres, getStores } from '../../services/api'

export default function Filters({ filters, onChange }) {
  const [genres, setGenres] = useState([])
  const [stores, setStores] = useState([])

  useEffect(() => {
    getGenres().then(({ data }) => setGenres(data)).catch(() => {})
    getStores().then(({ data }) => setStores(data)).catch(() => {})
  }, [])

  const handleChange = (field) => (e) => onChange({ ...filters, [field]: e.target.value })

  return (
    <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap' }}>
      <TextField
        size="small"
        label="Buscar"
        value={filters.search}
        onChange={handleChange('search')}
        sx={{ minWidth: 200 }}
      />
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Género</InputLabel>
        <Select value={filters.genre} label="Género" onChange={handleChange('genre')}>
          <MenuItem value="">Todos</MenuItem>
          {genres.map((g) => (
            <MenuItem key={g._id} value={g._id}>{g.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Tienda</InputLabel>
        <Select value={filters.store} label="Tienda" onChange={handleChange('store')}>
          <MenuItem value="">Todas</MenuItem>
          {stores.map((s) => (
            <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button variant="outlined" onClick={() => onChange({ search: '', genre: '', store: '' })}>
        Limpiar
      </Button>
    </Stack>
  )
}
