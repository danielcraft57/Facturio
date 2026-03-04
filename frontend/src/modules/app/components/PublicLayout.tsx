import type { PropsWithChildren } from 'react'
import { useState, useEffect } from 'react'
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  Container,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  useScrollTrigger,
  CssBaseline,
  alpha,
  Link,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import HomeIcon from '@mui/icons-material/Home'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import EuroIcon from '@mui/icons-material/Euro'
import LoginIcon from '@mui/icons-material/Login'
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../../stores/authStore'

const navItems = [
  { to: '/', label: 'Accueil', icon: <HomeIcon fontSize="small" /> },
  { to: '/#fonctionnalites', label: 'Fonctionnalités', icon: <AutoAwesomeIcon fontSize="small" /> },
  { to: '/#tarifs', label: 'Tarifs', icon: <EuroIcon fontSize="small" /> },
]

/** Lien navbar : style texte discret, pas bouton */
const NavLink = ({
  to,
  children,
  primary = false,
}: {
  to: string
  children: React.ReactNode
  primary?: boolean
}) => (
  <Link
    component={RouterLink}
    to={to}
    underline="none"
    sx={{
      color: 'text.primary',
      fontSize: '0.9375rem',
      fontWeight: primary ? 600 : 500,
      px: primary ? 2 : 1.5,
      py: 1,
      borderRadius: 2,
      transition: 'color 0.2s, background-color 0.2s',
      ...(primary
        ? {
            bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
            color: 'primary.main',
            '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.18), color: 'primary.dark' },
          }
        : {
            '&:hover': { color: 'primary.main', bgcolor: (t) => alpha(t.palette.primary.main, 0.06) },
          }),
    }}
  >
    {children}
  </Link>
)

type PublicLayoutProps = PropsWithChildren

/**
 * Layout des pages publiques : navbar avec effet au scroll, menu mobile, footer.
 */
export function PublicLayout({ children }: PublicLayoutProps) {
  const location = useLocation()
  const { isAuthenticated } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const trigger = useScrollTrigger({ disableHysteresis: true, threshold: 20 })

  useEffect(() => {
    setScrolled(trigger)
  }, [trigger])

  const handleDrawerToggle = () => setMobileOpen((v) => !v)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: scrolled ? (theme) => alpha(theme.palette.background.paper, 0.92) : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? 1 : 0,
          borderColor: 'divider',
          transition: 'background-color 0.3s ease, backdrop-filter 0.3s ease, box-shadow 0.3s ease',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ py: 1.5 }}>
            <Typography
              variant="h5"
              component={RouterLink}
              to="/"
              sx={{
                fontWeight: 700,
                color: 'primary.main',
                textDecoration: 'none',
                flexGrow: { xs: 1, sm: 0 },
                transition: 'transform 0.2s ease',
                '&:hover': { transform: 'scale(1.02)' },
              }}
            >
              Facturio
            </Typography>

            <Box
              sx={{
                flexGrow: 1,
                display: { xs: 'none', md: 'flex' },
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: 0.5,
                ml: 4,
              }}
            >
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to}>
                  {item.label}
                </NavLink>
              ))}
              {isAuthenticated ? (
                <NavLink to="/dashboard" primary>
                  Tableau de bord
                </NavLink>
              ) : (
                <>
                  <NavLink to="/login">Connexion</NavLink>
                  <NavLink to="/signup" primary>
                    Inscription
                  </NavLink>
                </>
              )}
            </Box>

            <IconButton
              color="inherit"
              aria-label="menu"
              onClick={handleDrawerToggle}
              sx={{ display: { md: 'none' }, color: 'text.primary', ml: 'auto' }}
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer
        anchor="right"
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: 300,
            maxWidth: '85vw',
            boxSizing: 'border-box',
            pt: 2,
            pb: 3,
            borderRadius: '16px 0 0 16px',
            boxShadow: (t) => t.shadows[10],
            backgroundImage: (t) =>
              `linear-gradient(135deg, ${alpha(t.palette.background.paper, 0.98)}, ${alpha(
                t.palette.primary.light,
                0.08
              )})`,
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            pb: 1,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Menu
          </Typography>
          <IconButton onClick={handleDrawerToggle} aria-label="fermer" size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <List
          sx={{
            px: 1,
            pt: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
          }}
        >
          {navItems.map((item) => (
            <ListItem key={item.to} disablePadding>
              <ListItemButton
                component={RouterLink}
                to={item.to}
                onClick={handleDrawerToggle}
                selected={location.pathname === item.to}
                sx={{
                  borderRadius: 2,
                  py: 1.1,
                  px: 1.5,
                  transition: 'background-color 0.18s ease, transform 0.16s ease',
                  '& .MuiListItemText-primary': {
                    fontWeight: 500,
                    letterSpacing: 0.1,
                  },
                  '&:hover': {
                    transform: 'translateX(-4px)',
                  },
                }}
              >
                {item.icon && (
                  <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                    {item.icon}
                  </ListItemIcon>
                )}
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
          {isAuthenticated ? (
            <ListItem disablePadding>
              <ListItemButton
                component={RouterLink}
                to="/dashboard"
                onClick={handleDrawerToggle}
                sx={{
                  borderRadius: 1,
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
                  color: 'primary.main',
                  fontWeight: 600,
                }}
              >
                <ListItemText primary="Tableau de bord" />
              </ListItemButton>
            </ListItem>
          ) : (
            <>
              <ListItem disablePadding>
                <ListItemButton
                  component={RouterLink}
                  to="/login"
                  onClick={handleDrawerToggle}
                  sx={{
                    borderRadius: 2,
                    py: 1.1,
                    px: 1.5,
                    transition: 'background-color 0.18s ease, transform 0.16s ease',
                    '&:hover': {
                      transform: 'translateX(-4px)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
                    <LoginIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Connexion" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  component={RouterLink}
                  to="/signup"
                  onClick={handleDrawerToggle}
                  sx={{
                    borderRadius: 2,
                    py: 1.1,
                    px: 1.5,
                    bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
                    color: 'primary.main',
                    fontWeight: 600,
                    transition: 'background-color 0.18s ease, transform 0.16s ease, box-shadow 0.18s ease',
                    boxShadow: 'none',
                    '&:hover': {
                      transform: 'translateX(-4px)',
                      boxShadow: (t) => t.shadows[3],
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                    <PersonAddAltIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Inscription" />
                </ListItemButton>
              </ListItem>
            </>
          )}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1 }}>
        {children}
      </Box>

      <Box
        component="footer"
        sx={{
          bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
          borderTop: 1,
          borderColor: 'divider',
          py: 5,
          mt: 'auto',
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} Facturio. Tous droits réservés.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Button component={RouterLink} to="/legal" size="small" sx={{ color: 'text.secondary' }}>
                Mentions légales
              </Button>
              <Button component={RouterLink} to="/privacy" size="small" sx={{ color: 'text.secondary' }}>
                Confidentialité
              </Button>
              <Button component={RouterLink} to="/terms" size="small" sx={{ color: 'text.secondary' }}>
                CGU
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}
