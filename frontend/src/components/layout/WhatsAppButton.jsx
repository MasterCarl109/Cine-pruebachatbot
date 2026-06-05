import { Fab } from '@mui/material'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'

const PHONE = '51956352201'
const WHATSAPP_URL = `https://wa.me/${PHONE}`

export default function WhatsAppButton() {
  return (
    <Fab
      color="success"
      sx={{ position: 'fixed', bottom: 90, right: 20, zIndex: 1200, bgcolor: '#25D366', '&:hover': { bgcolor: '#1ebe5d' } }}
      onClick={() => window.open(WHATSAPP_URL, '_blank')}
    >
      <WhatsAppIcon sx={{ fontSize: 28 }} />
    </Fab>
  )
}
