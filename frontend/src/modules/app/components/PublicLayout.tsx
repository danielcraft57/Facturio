import type { PropsWithChildren } from 'react'
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  Container,
} from '@mui/material'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../../stores/authStore'

type PublicLayoutProps = PropsWithChildren

/**
 * Layout pour les pages publiques (landing, login, signup)
 * 
 * Affiche un header simple avec navigation vers login/signup
 * et un footer basique.
 */
export function PublicLayout({ children }: PublicLayoutProps) {
  const location = useLocation()
  const { isAuthenticated } = useAuthStore()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ py: 2 }}>
            {/* Logo / Nom */}
            <Typography
              variant="h5"
              component={RouterLink}
              to="/"
              sx={{
                fontWeight: 700,
                color: 'primary.main',
                textDecoration: 'none',
                flexGrow: { xs: 1, sm: 0 },
              }}
            >
              Facturio
            </Typography>

            {/* Navigation */}
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'flex-end', gap: 2, ml: 4 }}>
              <Button
                component={RouterLink}
                to="/"
                color="inherit"
                sx={{ color: 'text.primary' }}
              >
                Accueil
              </Button>
              <Button
                component={RouterLink}
                to="/features"
                color="inherit"
                sx={{ color: 'text.primary' }}
              >
                Fonctionnalités
              </Button>
              <Button
                component={RouterLink}
                to="/pricing"
                color="inherit"
                sx={{ color: 'text.primary' }}
              >
                Tarifs
              </Button>
            </Box>

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
              {isAuthenticated ? (
                <Button
                  component={RouterLink}
                  to="/dashboard"
                  variant="contained"
                  color="primary"
                >
                  Tableau de bord
                </Button>
              ) : (
                <>
                  <Button
                    component={RouterLink}
                    to="/login"
                    color="inherit"
                    sx={{ color: 'text.primary' }}
                  >
                    Connexion
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/signup"
                    variant="contained"
                    color="primary"
                  >
                    Inscription
                  </Button>
                </>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Contenu principal */}
      <Box component="main" sx={{ flexGrow: 1 }}>
        {children}
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
          py: 4,
          mt: 'auto',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} Facturio. Tous droits réservés.
            </Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Button
                component={RouterLink}
                to="/legal"
                size="small"
                sx={{ color: 'text.secondary' }}
              >
                Mentions légales
              </Button>
              <Button
                component={RouterLink}
                to="/privacy"
                size="small"
                sx={{ color: 'text.secondary' }}
              >
                Confidentialité
              </Button>
              <Button
                component={RouterLink}
                to="/terms"
                size="small"
                sx={{ color: 'text.secondary' }}
              >
                CGU
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}

