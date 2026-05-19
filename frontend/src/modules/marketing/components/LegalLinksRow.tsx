import { Box, Button, Typography, alpha } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { DANIELCRAFT_PUBLISHER } from '../../legal/danielcraftPublisher'

const LINKS = [
  { to: '/legal', label: 'Mentions légales' },
  { to: '/terms', label: 'CGU' },
  { to: '/cgv', label: 'CGV' },
  { to: '/privacy', label: 'Confidentialité' },
] as const

/** Liens légaux Facturio + renvoi site DanielCraft (accueil). */
export function LegalLinksRow() {
  return (
    <Box
      sx={{
        py: { xs: 4, md: 5 },
        bgcolor: (t) => alpha(t.palette.primary.main, 0.03),
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      <Box sx={{ maxWidth: 720, mx: 'auto', px: 2, textAlign: 'center' }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Informations légales
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Facturio est édité par {DANIELCRAFT_PUBLISHER.legalName} ({DANIELCRAFT_PUBLISHER.tradeName}) — SIRET{' '}
          {DANIELCRAFT_PUBLISHER.siret}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mb: 2 }}>
          {LINKS.map((link) => (
            <Button
              key={link.to}
              component={RouterLink}
              to={link.to}
              size="small"
              variant="outlined"
              sx={{ borderRadius: 2 }}
            >
              {link.label}
            </Button>
          ))}
        </Box>
        <Button
          component="a"
          href={DANIELCRAFT_PUBLISHER.website}
          target="_blank"
          rel="noopener noreferrer"
          size="small"
          color="inherit"
        >
          {DANIELCRAFT_PUBLISHER.websiteLabel}
        </Button>
      </Box>
    </Box>
  )
}
