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
  Chip,
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
import SettingsIcon from '@mui/icons-material/Settings'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { useState } from 'react'

type AppLayoutProps = PropsWithChildren<{
  mode: 'light' | 'dark'
  onToggleMode: () => void
  onOpenSettings?: () => void
}>

const drawerWidth = 280

export function AppLayout({ children, mode, onToggleMode, onOpenSettings }: AppLayoutProps) {
  const theme = useTheme()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const items = [
    { 
      to: '/', 
      label: 'Dashboard', 
      icon: <DashboardIcon />,
      description: 'Vue d\'ensemble'
    },
    { 
      to: '/clients', 
      label: 'Clients', 
      icon: <PeopleIcon />,
      description: 'Gestion des clients'
    },
    { 
      to: '/devis', 
      label: 'Devis', 
      icon: <DescriptionIcon />,
      description: 'Création et suivi'
    },
    { 
      to: '/factures', 
      label: 'Factures', 
      icon: <ReceiptLongIcon />,
      description: 'Facturation'
    },
    { 
      to: '/produits', 
      label: 'Produits', 
      icon: <Inventory2Icon />,
      description: 'Catalogue produits'
    },
    { 
      to: '/taxes', 
      label: 'Taxes', 
      icon: <LocalAtmIcon />,
      description: 'Gestion fiscale'
    },
    { 
      to: '/abonnements', 
      label: 'Abonnements', 
      icon: <AutorenewIcon />,
      description: 'Services récurrents'
    },
    { 
      to: '/declarations', 
      label: 'Déclarations', 
      icon: <GavelIcon />,
      description: 'Obligations légales'
    },
    { 
      to: '/comptabilite', 
      label: 'Comptabilité', 
      icon: <AccountBalanceIcon />,
      description: 'Suivi comptable'
    },
  ]

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const drawer = (
    <>
      <Toolbar sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: 80,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <Avatar 
            sx={{ 
              width: 48, 
              height: 48, 
              bgcolor: 'rgba(255,255,255,0.2)', 
              mb: 1,
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}
          >
            F
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
            Facturio
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.75rem' }}>
            Gestion commerciale
          </Typography>
        </Box>
      </Toolbar>
      
      <Divider />
      
      <Box sx={{ p: 2, pb: 1 }}>
        <Typography variant="overline" sx={{ 
          fontSize: '0.7rem', 
          fontWeight: 600, 
          color: 'text.secondary',
          letterSpacing: '0.1em'
        }}>
          Navigation
        </Typography>
      </Box>
      
      <List sx={{ px: 1 }}>
        {items.map(item => {
          const isSelected = location.pathname === item.to
          return (
            <ListItem key={item.to} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton 
                component={RouterLink} 
                to={item.to} 
                selected={isSelected}
                onClick={() => setMobileOpen(false)}
                sx={{
                  borderRadius: 2,
                  mx: 0.5,
                  '&.Mui-selected': {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  },
                  '&:hover': {
                    background: theme.palette.mode === 'light' 
                      ? 'rgba(102, 126, 234, 0.08)' 
                      : 'rgba(102, 126, 234, 0.12)',
                  },
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: 40,
                  color: isSelected ? 'white' : 'inherit'
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label}
                  secondary={item.description}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isSelected ? 600 : 500,
                  }}
                  sx={{
                    '& .MuiListItemText-secondary': {
                      fontSize: '0.7rem',
                      opacity: isSelected ? 0.8 : 0.6,
                    }
                  }}
                />
                {isSelected && (
                  <Chip 
                    label="Actif" 
                    size="small" 
                    sx={{ 
                      height: 20, 
                      fontSize: '0.65rem',
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      '& .MuiChip-label': { px: 1 }
                    }} 
                  />
                )}
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>
      
      <Box sx={{ flexGrow: 1 }} />
      
      <Divider />
      
      <Box sx={{ p: 2 }}>
        <Typography variant="overline" sx={{ 
          fontSize: '0.7rem', 
          fontWeight: 600, 
          color: 'text.secondary',
          letterSpacing: '0.1em'
        }}>
          Paramètres
        </Typography>
        <List sx={{ px: 1, pt: 1 }}>
          <ListItem disablePadding>
            <ListItemButton 
              onClick={onToggleMode}
              sx={{
                borderRadius: 2,
                mx: 0.5,
                '&:hover': {
                  background: theme.palette.mode === 'light' 
                    ? 'rgba(102, 126, 234, 0.08)' 
                    : 'rgba(102, 126, 234, 0.12)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {mode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
              </ListItemIcon>
              <ListItemText 
                primary={mode === 'light' ? 'Mode sombre' : 'Mode clair'}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              />
            </ListItemButton>
          </ListItem>
          
          <ListItem disablePadding>
            <ListItemButton 
              onClick={onOpenSettings}
              sx={{
                borderRadius: 2,
                mx: 0.5,
                '&:hover': {
                  background: theme.palette.mode === 'light' 
                    ? 'rgba(102, 126, 234, 0.08)' 
                    : 'rgba(102, 126, 234, 0.12)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Réglages du thème"
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 2 }}>
        <Toolbar>
          <IconButton 
            color="inherit" 
            edge="start" 
            sx={{ mr: 2 }}
            onClick={handleDrawerToggle}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            Facturio
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={mode === 'light' ? 'Mode sombre' : 'Mode clair'}>
              <IconButton color="inherit" onClick={onToggleMode}>
                {mode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Réglages du thème">
              <IconButton color="inherit" onClick={onOpenSettings}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer responsive - toujours temporaire */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          zIndex: theme.zIndex.drawer,
          '& .MuiDrawer-paper': { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            border: 'none',
            boxShadow: theme.shadows[8]
          },
        }}
      >
        {drawer}
      </Drawer>

      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: { xs: 1, sm: 2, md: 3 },
          width: '100%'
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  )
}


