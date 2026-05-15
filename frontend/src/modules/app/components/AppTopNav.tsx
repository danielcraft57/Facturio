import { Box, Button, alpha, useTheme } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { navDashboard, navGroups, navSettings, isNavActive } from '../config/navConfig'
import { AppMegaMenu } from './AppMegaMenu'

function NavTextLink({ to, label, active }: { to: string; label: string; active: boolean }) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  return (
    <Button
      component={RouterLink}
      to={to}
      sx={{
        color: 'inherit',
        fontWeight: active ? 600 : 500,
        fontSize: '0.9375rem',
        textTransform: 'none',
        px: 1.25,
        py: 0.75,
        minHeight: 40,
        borderRadius: 1.5,
        letterSpacing: '-0.01em',
        opacity: active ? 1 : 0.88,
        boxShadow: active ? `inset 0 -2px 0 ${theme.palette.primary.main}` : 'none',
        bgcolor: active ? alpha(theme.palette.primary.main, isDark ? 0.12 : 0.06) : 'transparent',
        '&:hover': {
          opacity: 1,
          bgcolor: alpha(theme.palette.primary.main, isDark ? 0.1 : 0.05),
        },
      }}
    >
      {label}
    </Button>
  )
}

/** Navigation desktop — mega-menus style finance (Bloxs / Finch / fintech). */
export function AppTopNav() {
  const location = useLocation()
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  return (
    <Box
      sx={{
        display: { xs: 'none', lg: 'flex' },
        alignItems: 'center',
        gap: 0.25,
        flex: 1,
        ml: 3,
      }}
    >
      <NavTextLink
        to={navDashboard.to}
        label={navDashboard.label}
        active={isNavActive(location.pathname, navDashboard.to)}
      />
      {navGroups.map((group) => (
        <AppMegaMenu key={group.id} group={group} />
      ))}
      <NavTextLink
        to={navSettings.to}
        label={navSettings.label}
        active={isNavActive(location.pathname, navSettings.to)}
      />

      <Button
        component={RouterLink}
        to="/factures"
        variant="contained"
        size="small"
        startIcon={<AddIcon sx={{ fontSize: 18 }} />}
        sx={{
          ml: 1.5,
          textTransform: 'none',
          fontWeight: 700,
          fontSize: '0.8125rem',
          borderRadius: 2,
          px: 2,
          py: 0.75,
          bgcolor: isDark ? '#1e40af' : '#0f172a',
          boxShadow: `0 4px 14px ${alpha('#0f172a', 0.25)}`,
          '&:hover': {
            bgcolor: isDark ? '#2563eb' : '#1e3a5f',
            boxShadow: `0 6px 20px ${alpha('#0f172a', 0.3)}`,
          },
        }}
      >
        Nouvelle facture
      </Button>
    </Box>
  )
}
