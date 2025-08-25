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
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PeopleIcon from '@mui/icons-material/People'
import DescriptionIcon from '@mui/icons-material/Description'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import LocalAtmIcon from '@mui/icons-material/LocalAtm'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import GavelIcon from '@mui/icons-material/Gavel'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import { Link as RouterLink, useLocation } from 'react-router-dom'

type AppLayoutProps = PropsWithChildren<{
  mode: 'light' | 'dark'
  onToggleMode: () => void
  onOpenSettings?: () => void
}>

const drawerWidth = 240

export function AppLayout({ children, mode, onToggleMode, onOpenSettings }: AppLayoutProps) {
  const theme = useTheme()
  const location = useLocation()

  const items = [
    { to: '/', label: 'Dashboard', icon: <DashboardIcon /> },
    { to: '/clients', label: 'Clients', icon: <PeopleIcon /> },
    { to: '/devis', label: 'Devis', icon: <DescriptionIcon /> },
    { to: '/factures', label: 'Factures', icon: <ReceiptLongIcon /> },
    { to: '/produits', label: 'Produits', icon: <Inventory2Icon /> },
    { to: '/taxes', label: 'Taxes', icon: <LocalAtmIcon /> },
    { to: '/abonnements', label: 'Abonnements', icon: <AutorenewIcon /> },
    { to: '/declarations', label: 'Déclarations', icon: <GavelIcon /> },
    { to: '/comptabilite', label: 'Comptabilité', icon: <AccountBalanceIcon /> },
  ]

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Facturio</Typography>
          <Tooltip title={mode === 'light' ? 'Mode sombre' : 'Mode clair'}>
            <IconButton color="inherit" onClick={onToggleMode}>
              {mode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Réglages du thème">
            <IconButton color="inherit" onClick={onOpenSettings}>
              <Inventory2Icon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Drawer variant="permanent" sx={{ width: drawerWidth, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' } }}>
        <Toolbar />
        <Divider />
        <List>
          {items.map(item => (
            <ListItem key={item.to} disablePadding>
              <ListItemButton component={RouterLink} to={item.to} selected={location.pathname === item.to}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  )
}


