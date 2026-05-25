import type { PropsWithChildren } from 'react'
import { useState, useEffect } from 'react'
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Container,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useScrollTrigger,
  CssBaseline,
  alpha,
  Link,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import LoginIcon from '@mui/icons-material/Login'
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../../stores/authStore'
import { PUBLIC_NAV } from '../../marketing/constants/siteContent'
import { CookieConsentBanner } from '../../legal/CookieConsentBanner'
import { PublicFooter } from './PublicFooter'

const NavLink = ({
  to,
  children,
  primary = false,
  compact = false,
  active = false,
}: {
  to: string
  children: React.ReactNode
  primary?: boolean
  compact?: boolean
  active?: boolean
}) => {
  return (
    <Link
      component={RouterLink}
      to={to}
      underline="none"
      aria-current={active ? 'page' : undefined}
      sx={{
        fontSize: compact ? '0.8125rem' : '0.875rem',
        fontWeight: active || primary ? 600 : 500,
        px: compact ? 1 : primary ? 2 : 1.25,
        py: 0.75,
        borderRadius: 2,
        whiteSpace: 'nowrap',
        transition: 'color 0.2s, background-color 0.2s, box-shadow 0.2s',
        ...(primary
          ? {
              bgcolor: (t) => (active ? t.palette.primary.dark : t.palette.primary.main),
              color: 'primary.contrastText',
              boxShadow: active ? 2 : 1,
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            }
          : active
            ? {
                bgcolor: (t) => alpha(t.palette.primary.main, 0.14),
                color: 'primary.main',
                '&:hover': {
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.18),
                  color: 'primary.dark',
                },
              }
            : {
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
                },
              }),
      }}
    >
      {children}
    </Link>
  )
}

type PublicLayoutProps = PropsWithChildren

function isNavActive(pathname: string, to: string) {
  if (to === '/') return pathname === '/'
  return pathname === to || pathname.startsWith(`${to}/`)
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  /** Accès app complet uniquement après validation email */
  const showDashboardLink = user?.emailVerified === true
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
          <Toolbar disableGutters sx={{ py: { xs: 1, md: 1.25 }, gap: 0.5, minHeight: { xs: 56, md: 64 } }}>
            <Typography
              variant="h6"
              component={RouterLink}
              to="/"
              sx={{
                fontWeight: 700,
                color: 'primary.main',
                textDecoration: 'none',
                flexShrink: 0,
                fontSize: { xs: '1.1rem', md: '1.25rem' },
                mr: { md: 1 },
              }}
            >
              Facturio
            </Typography>

            {/* Tablette + desktop : nav horizontale (md+) */}
            <Box
              sx={{
                flexGrow: 1,
                display: { xs: 'none', md: 'flex' },
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: 0.25,
                overflowX: 'auto',
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': { display: 'none' },
              }}
            >
              {PUBLIC_NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  compact
                  active={isNavActive(location.pathname, item.to)}
                >
                  {item.shortLabel}
                </NavLink>
              ))}
              {showDashboardLink ? (
                <NavLink
                  to="/dashboard"
                  primary
                  compact
                  active={location.pathname.startsWith('/dashboard')}
                >
                  Tableau de bord
                </NavLink>
              ) : (
                <>
                  <NavLink to="/login" compact active={location.pathname === '/login'}>
                    Connexion
                  </NavLink>
                  <NavLink to="/signup" primary compact active={location.pathname === '/signup'}>
                    Inscription
                  </NavLink>
                </>
              )}
            </Box>

            {/* Mobile uniquement (xs–sm) : menu */}
            <IconButton
              color="inherit"
              aria-label="menu"
              onClick={handleDrawerToggle}
              sx={{ display: { xs: 'flex', md: 'none' }, color: 'text.primary', ml: 'auto' }}
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
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, pb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Menu
          </Typography>
          <IconButton onClick={handleDrawerToggle} aria-label="fermer" size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <List sx={{ px: 1, pt: 1 }}>
          {PUBLIC_NAV.map((item) => (
            <ListItem key={item.to} disablePadding>
              <ListItemButton
                component={RouterLink}
                to={item.to}
                onClick={handleDrawerToggle}
                selected={isNavActive(location.pathname, item.to)}
                sx={{ borderRadius: 2, py: 1.1 }}
              >
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
          {showDashboardLink ? (
            <ListItem disablePadding>
              <ListItemButton
                component={RouterLink}
                to="/dashboard"
                onClick={handleDrawerToggle}
                selected={location.pathname.startsWith('/dashboard')}
                sx={{ borderRadius: 2, py: 1.1 }}
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
                  selected={location.pathname === '/login'}
                  sx={{ borderRadius: 2, py: 1.1 }}
                >
                  <LoginIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
                  <ListItemText primary="Connexion" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  component={RouterLink}
                  to="/signup"
                  onClick={handleDrawerToggle}
                  selected={location.pathname === '/signup'}
                  sx={{ borderRadius: 2, py: 1.1 }}
                >
                  <PersonAddAltIcon fontSize="small" sx={{ mr: 1.5 }} />
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

      <PublicFooter />
      <CookieConsentBanner />
    </Box>
  )
}
