import { Card, CardMedia, CardContent, Typography, Chip, Box, Stack } from '@mui/material'

export default function MovieCard({ movie, onClick }) {
  return (
    <Card
      onClick={() => onClick?.(movie)}
      sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: '0.2s', cursor: onClick ? 'pointer' : 'default', '&:hover': onClick ? { transform: 'translateY(-4px)', boxShadow: 4 } : {} }}>
      <CardMedia
        component="img"
        height="200"
        image={movie.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(movie.title)}&background=1565c0&color=fff&size=200`}
        alt={movie.title}
      />
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" gutterBottom noWrap>
          {movie.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, flex: 1 }}>
          {movie.synopsis?.slice(0, 120)}...
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
          <Chip label={movie.year} size="small" variant="outlined" />
          <Chip label={movie.rating} size="small" color="primary" variant="outlined" />
        </Stack>
        <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
          {movie.genres?.map((g) => (
            <Chip key={g._id} label={g.name} size="small" color="secondary" variant="outlined" />
          ))}
        </Stack>

      </CardContent>
    </Card>
  )
}
