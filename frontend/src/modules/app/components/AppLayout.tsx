import type { PropsWithChildren } from 'react'
import {
  AppBar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  Tooltip,
  Avatar,
  Menu,
  MenuItem,
  MenuList,
  alpha,
  Divider as MuiDivider,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import SettingsIcon from '@mui/icons-material/Settings'
import LogoutIcon from '@mui/icons-material/Logout'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import AddIcon from '@mui/icons-material/Add'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { prefetchFinanceRouteChunks } from '../../../utils/prefetchFinanceRoutes'
import { useAuthStore } from '../../../stores/authStore'
import { AppTopNav } from './AppTopNav'
import { AppMobileNav } from './AppMobileNav'
import { NotificationCenter } from './NotificationCenter'
import { BillingQuotaStrip } from './BillingQuotaStrip'
import { DemoModeBanner } from '../../../components/demo/DemoModeBanner'
import { DemoEntryMessageNotifier } from '../../../components/demo/DemoEntryMessageNotifier'
import { DemoEntryNotice } from '../../../components/demo/DemoEntryNotice'
import { demoService } from '../../../services/demoService'
import { LifecycleNotifier } from './LifecycleNotifier'
import { userMenuLinks } from '../config/userMenuConfig'
import { PageTransition } from '../../../components/PageTransition'
import { WelcomeDialogHost } from '../../../components/marketing/WelcomeDialogHost'
import { CommandPaletteHost } from './CommandPalette'

type AppLayoutProps = PropsWithChildren<{
  mode: 'light' | 'dark'
  onToggleMode: () => void
  onOpenSettings?: () => void
}>

const drawerWidth = 280

export function AppLayout({ children, mode, onToggleMode, onOpenSettings }: AppLayoutProps) {
  const theme = useTheme()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null)
  const { user, logout } = useAuthStore()
  const isDemo = demoService.isDemoSession()

  useEffect(() => {
    prefetchFinanceRouteChunks()
  }, [])

  const handleLogout = async () => {
    setUserMenuAnchor(null)
    await logout()
    navigate('/login')
  }

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar
        sx={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          minHeight: 72,
          px: 2,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
          color: 'white',
        }}
      >
        <Avatar sx={{ width: 40, height: 40, bgcolor: alpha('#fff', 0.12) }}>
          <ReceiptLongIcon />
        </Avatar>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            PrestaFacture
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.75 }}>
            Facturation & finance
          </Typography>
        </Box>
      </Toolbar>

      <AppMobileNav onNavigate={() => setMobileOpen(false)} />

      <Divider />

      <Box sx={{ p: 2 }}>
        <List dense>
          <ListItem disablePadding>
            <ListItemButton onClick={onToggleMode} sx={{ borderRadius: 2 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                {mode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
              </ListItemIcon>
              <ListItemText primary={mode === 'light' ? 'Mode sombre' : 'Mode clair'} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={onOpenSettings} sx={{ borderRadius: 2 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Réglages du thème" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Box>
  )

  const isDark = theme.palette.mode === 'dark'

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <WelcomeDialogHost />
      <AppBar
        position="fixed"
        elevation={0}
        color="default"
        sx={{
          zIndex: theme.zIndex.drawer + 2,
          bgcolor: isDark ? alpha('#0c1222', 0.92) : alpha('#ffffff', 0.94),
          color: isDark ? 'grey.100' : 'grey.900',
          backdropFilter: 'saturate(180%) blur(14px)',
          borderBottom: '1px solid',
          borderColor: isDark ? alpha('#fff', 0.08) : alpha('#0f172a', 0.08),
        }}
      >
        <Toolbar sx={{ gap: 1, minHeight: { xs: 56, md: 64 }, px: { xs: 1.5, md: 2, lg: 3 } }}>
          <IconButton
            edge="start"
            sx={{ display: { md: 'none' }, color: 'inherit' }}
            onClick={() => setMobileOpen(true)}
            aria-label="Menu principal"
          >
            <MenuIcon />
          </IconButton>

          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              textDecoration: 'none',
              color: 'inherit',
              flexShrink: 0,
            }}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: isDark ? alpha('#3b82f6', 0.2) : alpha('#1e40af', 0.1),
                color: isDark ? '#93c5fd' : '#1e40af',
              }}
            >
              <ReceiptLongIcon fontSize="small" />
            </Avatar>
            <Typography
              variant="h6"
              sx={{ fontWeight: 800, fontSize: { xs: '1.05rem', sm: '1.15rem' }, letterSpacing: '-0.03em' }}
            >
              PrestaFacture
            </Typography>
          </Box>

          <AppTopNav />

          <Box sx={{ flexGrow: 1, display: { xs: 'block', md: 'none' } }} />

          <Tooltip title={isDemo ? 'Aperçu création facture' : 'Nouvelle facture'}>
            <IconButton
              onClick={() => {
                navigate('/factures/inbox?create=1')
              }}
              color="inherit"
              aria-label="nouvelle facture"
              sx={{
                display: { xs: 'inline-flex', md: 'none' },
                bgcolor: alpha(isDark ? '#3b82f6' : '#0f172a', isDark ? 0.25 : 0.08),
                '&:hover': { bgcolor: alpha(isDark ? '#3b82f6' : '#0f172a', isDark ? 0.35 : 0.14) },
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0, ml: { md: 'auto' } }}>
            <CommandPaletteHost />
            <NotificationCenter />
            <Tooltip title={mode === 'light' ? 'Mode sombre' : 'Mode clair'}>
              <IconButton color="inherit" onClick={onToggleMode} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                {mode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Réglages du thème">
              <IconButton color="inherit" onClick={onOpenSettings} sx={{ display: { xs: 'none', md: 'inline-flex' } }}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            {user && (
              <Tooltip title="Compte">
                <IconButton color="inherit" onClick={(e) => setUserMenuAnchor(e.currentTarget)} sx={{ ml: 0.5 }}>
                  <Avatar
                    sx={{
                      width: 34,
                      height: 34,
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      bgcolor: isDark ? '#1e3a5f' : '#0f172a',
                      color: '#fff',
                    }}
                  >
                    {user.firstName?.[0] || user.email[0].toUpperCase()}
                  </Avatar>
                </IconButton>
              </Tooltip>
            )}
          </Box>

          <Menu
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={() => setUserMenuAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{ paper: { sx: { minWidth: 280, maxWidth: 320 } } }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="body2" fontWeight={600}>
                {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email}
              </Typography>
              {user?.organization && (
                <Typography variant="caption" color="text.secondary">
                  {user.organization.name}
                </Typography>
              )}
            </Box>
            <MuiDivider />
            <MenuList dense sx={{ py: 0.5 }}>
              {userMenuLinks.map((link) => (
                <MenuItem
                  key={link.to}
                  component={RouterLink}
                  to={link.to}
                  onClick={() => setUserMenuAnchor(null)}
                  sx={{ py: 1, alignItems: 'flex-start' }}
                >
                  {link.icon && <ListItemIcon sx={{ minWidth: 36, mt: 0.25 }}>{link.icon}</ListItemIcon>}
                  <ListItemText
                    primary={link.label}
                    secondary={link.description}
                    primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                    secondaryTypographyProps={{ fontSize: '0.7rem' }}
                  />
                </MenuItem>
              ))}
            </MenuList>
            <MuiDivider />
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <ListItemIcon sx={{ color: 'inherit' }}>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Déconnexion
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { md: 'none' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            border: 'none',
            boxShadow: theme.shadows[12],
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
        }}
      >
        {drawer}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, width: '100%', p: { xs: 1, sm: 2, md: 3 } }}>
        <Toolbar sx={{ minHeight: { xs: 56, md: 64 } }} />
        <BillingQuotaStrip />
        <DemoEntryNotice />
        <DemoModeBanner />
        <DemoEntryMessageNotifier />
        <LifecycleNotifier />
        <PageTransition>{children}</PageTransition>
      </Box>
    </Box>
  )
}
