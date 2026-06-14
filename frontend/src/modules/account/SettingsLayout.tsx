import { Link as RouterLink, useLocation } from 'react-router-dom'
import { OrganizationProfileProvider, useOrganizationProfile } from './OrganizationProfileContext'
import { AnimatedSettingsOutlet } from './components/AnimatedSettingsOutlet'
import {
  Box,
  Card,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { settingsNavItems, filterSettingsNavItems, isSettingsPathActive, settingsNavFilterFromUsage } from './settingsNav'
import { useBillingUsage } from '../../hooks/useBillingUsage'
import { SettingsAutoSaveStatus } from './components/SettingsAutoSaveStatus'

function SettingsLayoutContent() {
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { autoSaveStatus, error, validationMessage } = useOrganizationProfile()
  const { usage } = useBillingUsage()

  const visibleNavItems = filterSettingsNavItems(settingsNavItems, settingsNavFilterFromUsage(usage))

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
          gridTemplateColumns: { xs: '1fr', md: '240px 1fr' },
          gap: 3,
          alignItems: 'start',
        }}
      >
        <Card
          variant="outlined"
          sx={{
            position: { md: 'sticky' },
            top: { md: 88 },
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <List dense disablePadding sx={{ py: 0.5 }}>
            {visibleNavItems.map((item) => {
              const active = isSettingsPathActive(location.pathname, item.to)
              return (
                <ListItemButton
                  key={item.to}
                  component={RouterLink}
                  to={item.to}
                  selected={active}
                  sx={{
                    py: 1.25,
                    borderLeft: 3,
                    borderColor: active ? 'primary.main' : 'transparent',
                    bgcolor: active ? (t) => alpha(t.palette.primary.main, 0.08) : 'transparent',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: active ? 'primary.main' : 'text.secondary' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    secondary={isMobile ? undefined : item.description}
                    primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: active ? 600 : 500 }}
                    secondaryTypographyProps={{ fontSize: '0.7rem', noWrap: !isMobile }}
                  />
                </ListItemButton>
              )
            })}
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
