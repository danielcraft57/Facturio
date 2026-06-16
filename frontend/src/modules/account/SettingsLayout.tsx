import { Link as RouterLink, useLocation } from 'react-router-dom'
import { OrganizationProfileProvider, useOrganizationProfile } from './OrganizationProfileContext'
import { AnimatedSettingsOutlet } from './components/AnimatedSettingsOutlet'
import {
  Box,
  Card,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import {
  settingsNavItems,
  filterSettingsNavItems,
  groupSettingsNavItems,
  isSettingsPathActive,
  settingsNavFilterFromUsage,
} from './settingsNav'
import { useBillingUsage } from '../../hooks/useBillingUsage'
import { SettingsAutoSaveStatus } from './components/SettingsAutoSaveStatus'
import { ProPlanBadge } from '../../components/billing/ProPlanBadge'

function SettingsLayoutContent() {
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { autoSaveStatus, error, validationMessage } = useOrganizationProfile()
  const { usage } = useBillingUsage()

  const visibleNavItems = filterSettingsNavItems(settingsNavItems, settingsNavFilterFromUsage(usage))
  const navGroups = groupSettingsNavItems(visibleNavItems)

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h5" sx={{ mb: 0.5, fontWeight: 700 }}>
        Paramètres
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Compte, entreprise, facturation électronique et préférences.
      </Typography>

      <SettingsAutoSaveStatus
        status={autoSaveStatus}
        error={error}
        blockedMessage={validationMessage}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '260px 1fr' },
          gap: 3,
          alignItems: 'start',
        }}
      >
        <Card
          variant="outlined"
          sx={{
            position: { md: 'sticky' },
            top: { md: 88 },
            borderRadius: 2.5,
            overflow: 'hidden',
            bgcolor: (t) => (t.palette.mode === 'dark' ? alpha('#fff', 0.02) : alpha('#f8fafc', 0.9)),
          }}
        >
          <List dense disablePadding sx={{ py: 1 }}>
            {navGroups.map((group, groupIndex) => (
              <Box key={group.section}>
                {group.section !== 'overview' && (
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      px: 2,
                      pt: groupIndex === 0 ? 0.5 : 1.25,
                      pb: 0.5,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'text.secondary',
                      fontSize: '0.65rem',
                    }}
                  >
                    {group.label}
                  </Typography>
                )}
                {group.items.map((item) => {
                  const active = isSettingsPathActive(location.pathname, item.to)
                  const locked = item.planLocked === true
                  return (
                    <ListItemButton
                      key={item.to}
                      component={RouterLink}
                      to={item.to}
                      selected={active}
                      sx={{
                        py: 1.1,
                        mx: 0.75,
                        mb: 0.25,
                        borderRadius: 1.5,
                        borderLeft: 3,
                        borderColor: active ? 'primary.main' : 'transparent',
                        bgcolor: active
                          ? (t) => alpha(t.palette.primary.main, 0.1)
                          : locked
                            ? (t) => alpha('#b45309', t.palette.mode === 'dark' ? 0.06 : 0.04)
                            : 'transparent',
                        opacity: locked && !active ? 0.88 : 1,
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 36,
                          color: active ? 'primary.main' : locked ? '#b45309' : 'text.secondary',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'nowrap' }}>
                            <Box component="span" sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.label}
                            </Box>
                            {locked && <ProPlanBadge />}
                            {locked && (
                              <LockOutlinedIcon sx={{ fontSize: 14, color: '#b45309', opacity: 0.7, ml: 'auto' }} />
                            )}
                          </Box>
                        }
                        secondary={isMobile ? undefined : item.description}
                        primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: active ? 600 : 500 }}
                        secondaryTypographyProps={{
                          fontSize: '0.68rem',
                          noWrap: !isMobile,
                          sx: { mt: 0.25 },
                        }}
                      />
                    </ListItemButton>
                  )
                })}
                {groupIndex < navGroups.length - 1 && group.section !== 'overview' && (
                  <Divider sx={{ my: 0.75, mx: 1.5 }} />
                )}
              </Box>
            ))}
          </List>
        </Card>

        <AnimatedSettingsOutlet />
      </Box>
    </Box>
  )
}

export function SettingsLayout() {
  return (
    <OrganizationProfileProvider>
      <SettingsLayoutContent />
    </OrganizationProfileProvider>
  )
}
