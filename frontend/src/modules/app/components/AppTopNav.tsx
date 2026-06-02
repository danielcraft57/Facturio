import { Box, Button, alpha, useTheme } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { navDashboard, navGroups, navSettings, isNavActive } from '../config/navConfig'
import { AppMegaMenu } from './AppMegaMenu'
import { topNavItemSx } from './topNavItemStyles'

function NavTextLink({ to, label, active }: { to: string; label: string; active: boolean }) {
  const theme = useTheme()

  return (
    <Button
      component={RouterLink}
      to={to}
      disableRipple
      sx={topNavItemSx(theme, active)}
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
        display: { xs: 'none', md: 'flex' },
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
        to="/factures/inbox"
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
