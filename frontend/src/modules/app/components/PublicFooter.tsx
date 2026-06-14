import { Box, Container, Link, Stack, Typography, alpha } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { DANIELCRAFT_PUBLISHER, FACTURIO_SERVICE } from '../../legal/danielcraftPublisher'

const PRODUCT_LINKS = [
  { to: '/fonctionnalites', label: 'Fonctionnalités' },
  { to: '/prestations', label: 'Prestations' },
  { to: '/tarifs', label: 'Tarifs' },
  { to: '/facturation-electronique', label: 'Réforme 2026' },
] as const

const LEGAL_LINKS = [
  { to: '/legal', label: 'Mentions légales' },
  { to: '/terms', label: 'CGU' },
  { to: '/cgv', label: 'CGV' },
  { to: '/privacy', label: 'Confidentialité' },
] as const

const linkSx = {
  color: 'text.secondary',
  fontSize: '0.8125rem',
  textDecoration: 'none',
  '&:hover': { color: 'text.primary', textDecoration: 'underline' },
} as const

function FooterNav({ links }: { links: readonly { to: string; label: string }[] }) {
  return (
    <Stack component="nav" direction="row" flexWrap="wrap" gap={{ xs: 1.5, sm: 2.5 }} useFlexGap>
      {links.map((item) => (
        <Link key={item.to} component={RouterLink} to={item.to} sx={linkSx}>
          {item.label}
        </Link>
      ))}
    </Stack>
  )
}

export function PublicFooter() {
  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: (t) => alpha(t.palette.background.paper, 0.6),
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 5 } }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={{ xs: 3, md: 6 }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'flex-end' }}
        >
          <Box sx={{ maxWidth: 360 }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
              Facturio
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              Devis, facturation et compta pour développeurs freelances et agences web.
            </Typography>
          </Box>

          <Stack spacing={2.5} sx={{ width: { xs: '100%', md: 'auto' } }}>
            <FooterNav links={PRODUCT_LINKS} />
            <FooterNav links={LEGAL_LINKS} />
          </Stack>
        </Stack>

        <Box
          sx={{
            mt: 4,
            pt: 3,
            borderTop: 1,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1,
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
          }}
        >
          <Typography variant="caption" color="text.disabled">
            © {new Date().getFullYear()} {FACTURIO_SERVICE.name} · {DANIELCRAFT_PUBLISHER.legalName} · SIRET{' '}
            {DANIELCRAFT_PUBLISHER.siret}
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}
