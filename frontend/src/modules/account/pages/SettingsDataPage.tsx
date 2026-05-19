import { Typography, Box } from '@mui/material'
import { GdprAccountSection } from '../GdprAccountSection'

export function SettingsDataPage() {
  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
        Mes données
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Export de vos données et suppression de compte (droits RGPD).
      </Typography>
      <GdprAccountSection />
    </Box>
  )
}
