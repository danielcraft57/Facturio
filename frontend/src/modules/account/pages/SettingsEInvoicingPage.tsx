import { Typography, Box, Button, alpha } from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { Link as RouterLink } from 'react-router-dom'
import { EInvoicingReadinessPanel } from '../../e-invoicing/EInvoicingReadinessPanel'

export function SettingsEInvoicingPage() {
  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
        Facturation électronique 2026
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Préparez la réforme B2B : SIRET, SIREN clients, export Factur-X et suivi de conformité.
      </Typography>
      <EInvoicingReadinessPanel />
      <Box
        sx={{
          mt: 3,
          p: 2,
          borderRadius: 2,
          border: 1,
          borderColor: 'divider',
          bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Calendrier réglementaire, obligations et feuille de route détaillée.
        </Typography>
        <Button component={RouterLink} to="/facturation-electronique" size="small" endIcon={<OpenInNewIcon />}>
          Guide réforme 2026
        </Button>
      </Box>
    </Box>
  )
}
