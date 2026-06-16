import {
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  alpha,
  useTheme,
} from '@mui/material'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import AddIcon from '@mui/icons-material/Add'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { useState } from 'react'
import {
  navDashboard,
  navGroups,
  createNavSettingsGroup,
  filterNavGroups,
  isGroupActive,
  isNavActive,
  navPlanFilterFromUsage,
  type NavGroup,
} from '../config/navConfig'
import { useBillingUsage } from '../../../hooks/useBillingUsage'
import { settingsNavFilterFromUsage } from '../../account/settingsNav'

type AppMobileNavProps = {
  onNavigate?: () => void
}

function NavGroupSection({ group, onNavigate }: { group: NavGroup; onNavigate?: () => void }) {
  const theme = useTheme()
  const location = useLocation()
  const [expanded, setExpanded] = useState(true)
  const hasActive = isGroupActive(location.pathname, group)

  return (
    <Box sx={{ mb: 0.5 }}>
      <ListItemButton
        onClick={() => setExpanded((v) => !v)}
        sx={{
          borderRadius: 2,
          mx: 0.5,
          py: 0.75,
          bgcolor: hasActive ? alpha(theme.palette.primary.main, 0.06) : 'transparent',
        }}
      >
        <ListItemText
          primary={group.label}
          primaryTypographyProps={{
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'text.secondary',
          }}
        />
        {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
      </ListItemButton>
      <Collapse in={expanded}>
        <List dense disablePadding sx={{ pl: 0.5 }}>
          {group.overviewCta && (
            <ListItem disablePadding sx={{ mb: 0.25 }}>
              <ListItemButton
                component={RouterLink}
                to={group.overviewCta.to}
                selected={isNavActive(location.pathname, group.overviewCta.to)}
                onClick={onNavigate}
                sx={{
                  borderRadius: 2,
                  mx: 0.5,
                  py: 0.75,
                  '&.Mui-selected': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    borderLeft: 3,
                    borderColor: 'primary.main',
                  },
                }}
              >
                <ListItemText
                  primary={group.overviewCta.label}
                  primaryTypographyProps={{ fontSize: '0.8125rem', fontWeight: 500 }}
                />
              </ListItemButton>
            </ListItem>
          )}
          {group.items.map((item) => {
            const selected = isNavActive(location.pathname, item.to)
            return (
              <ListItem key={item.to} disablePadding sx={{ mb: 0.25 }}>
                <ListItemButton
                  component={RouterLink}
                  to={item.to}
                  selected={selected}
                  onClick={onNavigate}
                  sx={{
                    borderRadius: 2,
                    mx: 0.5,
                    py: 0.75,
                    '&.Mui-selected': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      borderLeft: 3,
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: selected ? 'primary.main' : 'text.secondary' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        {item.label}
                        {item.badge && (
                          <Chip label={item.badge} size="small" sx={{ height: 18, fontSize: '0.6rem' }} />
                        )}
                      </Box>
                    }
                    secondary={item.description}
                    primaryTypographyProps={{ fontSize: '0.8125rem', fontWeight: selected ? 600 : 500 }}
                    secondaryTypographyProps={{ fontSize: '0.68rem' }}
                  />
                </ListItemButton>
              </ListItem>
            )
          })}
        </List>
      </Collapse>
    </Box>
  )
}

export function AppMobileNav({ onNavigate }: AppMobileNavProps) {
  const theme = useTheme()
  const location = useLocation()
  const dashActive = isNavActive(location.pathname, navDashboard.to)
  const { usage } = useBillingUsage()
  const planFilter = navPlanFilterFromUsage(usage)
  const visibleNavGroups = filterNavGroups(navGroups, planFilter)
  const settingsGroup = createNavSettingsGroup(settingsNavFilterFromUsage(usage))

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 2, py: 1.5, flexShrink: 0 }}>
        <Button
          component={RouterLink}
          to="/factures/inbox?create=1"
          variant="contained"
          fullWidth
          startIcon={<AddIcon />}
          onClick={onNavigate}
          sx={{
            py: 1.25,
            fontWeight: 700,
            textTransform: 'none',
            borderRadius: 2,
            bgcolor: '#0f172a',
            '&:hover': { bgcolor: '#1e3a5f' },
          }}
        >
          Nouvelle facture
        </Button>
      </Box>

      <Divider />

      <List sx={{ px: 1, pt: 1, pb: 2 }}>
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            component={RouterLink}
            to={navDashboard.to}
            selected={dashActive}
            onClick={onNavigate}
            sx={{
              borderRadius: 2,
              mx: 0.5,
              '&.Mui-selected': {
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                borderLeft: 3,
                borderColor: 'primary.main',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: dashActive ? 'primary.main' : 'text.secondary' }}>
              {navDashboard.icon}
            </ListItemIcon>
            <ListItemText
              primary={navDashboard.label}
              secondary={navDashboard.description}
              primaryTypographyProps={{ fontWeight: dashActive ? 600 : 500, fontSize: '0.875rem' }}
            />
          </ListItemButton>
        </ListItem>

        {visibleNavGroups.map((group) => (
          <NavGroupSection key={group.id} group={group} onNavigate={onNavigate} />
        ))}

        <NavGroupSection group={settingsGroup} onNavigate={onNavigate} />
      </List>
    </Box>
  )
}
