import { Box, Button, alpha, useTheme } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { navDashboard, navGroups, createNavSettingsGroup, filterNavGroups, isNavActive, navPlanFilterFromUsage } from '../config/navConfig'
import { useBillingUsage } from '../../../hooks/useBillingUsage'
import { settingsNavFilterFromUsage } from '../../account/settingsNav'
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
  const navigate = useNavigate()
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const { usage } = useBillingUsage()
  const planFilter = navPlanFilterFromUsage(usage)
  const visibleNavGroups = filterNavGroups(navGroups, planFilter)
  const settingsGroup = createNavSettingsGroup(settingsNavFilterFromUsage(usage))

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
      {visibleNavGroups.map((group) => (
        <AppMegaMenu key={group.id} group={group} />
      ))}
      <AppMegaMenu group={settingsGroup} />

      <Button
        variant="contained"
        size="small"
        startIcon={<AddIcon sx={{ fontSize: 18 }} />}
        onClick={() => {
          navigate('/factures/inbox?create=1')
        }}
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
