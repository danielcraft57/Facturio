import type { PropsWithChildren } from 'react'
import { Box, Container, CssBaseline, Typography, alpha } from '@mui/material'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'

type ClientPaymentLayoutProps = PropsWithChildren

/**
 * Layout minimal pour la page de paiement client (sans navigation marketing).
 */
export function ClientPaymentLayout({ children }: ClientPaymentLayoutProps) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
      }}
    >
      <CssBaseline />
      <Box
        component="header"
        sx={{
          py: 2,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Facturio
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'text.secondary' }}>
              <LockOutlinedIcon fontSize="small" />
              <Typography variant="body2">Paiement sécurisé</Typography>
            </Box>
          </Box>
        </Container>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, py: { xs: 3, md: 5 } }}>
        {children}
      </Box>
      <Box
        component="footer"
        sx={{
          py: 2,
          textAlign: 'center',
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Connexion chiffrée · Vos données bancaires ne sont jamais stockées sur nos serveurs
        </Typography>
      </Box>
    </Box>
  )
}
