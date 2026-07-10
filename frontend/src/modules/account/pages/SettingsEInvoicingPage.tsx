import { Alert, Box, Button, List, ListItem, ListItemText, Stack, Typography, alpha } from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { Link as RouterLink } from 'react-router-dom'
import { EInvoicingReadinessPanel } from '../../e-invoicing/EInvoicingReadinessPanel'
import { EInvoicingUpgradeVitrine } from '../../../components/billing/EInvoicingUpgradeVitrine'
import {
  EFACTURE_IN_APP_DISCLAIMER,
  EFACTURE_LIVE_IN_APP,
  EFACTURE_ROADMAP_IN_APP,
} from '../../e-invoicing/eInvoicingCopy'

export function SettingsEInvoicingPage() {
  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
        Facturation électronique 2026
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Préparez la réforme B2B : SIRET, SIREN clients et suivi de conformité sur vos factures.
      </Typography>

      <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
        {EFACTURE_IN_APP_DISCLAIMER}
      </Alert>

      <Box
        sx={{
          mb: 3,
          p: 2,
          borderRadius: 2,
          border: 1,
          borderColor: 'divider',
          bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              Disponible aujourd&apos;hui
            </Typography>
            <List dense disablePadding>
              {EFACTURE_LIVE_IN_APP.map((item) => (
                <ListItem key={item} disableGutters sx={{ py: 0.25 }}>
                  <ListItemText primary={item} primaryTypographyProps={{ variant: 'body2' }} />
                </ListItem>
              ))}
            </List>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              Feuille de route (non activé)
            </Typography>
            <List dense disablePadding>
              {EFACTURE_ROADMAP_IN_APP.map((item) => (
                <ListItem key={item} disableGutters sx={{ py: 0.25 }}>
                  <ListItemText
                    primary={item}
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Stack>
      </Box>

      <EInvoicingUpgradeVitrine />

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
