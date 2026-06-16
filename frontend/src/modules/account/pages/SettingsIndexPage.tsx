import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import {
  filterSettingsNavItems,
  groupSettingsNavItems,
  settingsNavItems,
  settingsNavFilterFromUsage,
} from '../settingsNav'
import { useBillingUsage } from '../../../hooks/useBillingUsage'
import { ProPlanBadge } from '../../../components/billing/ProPlanBadge'

export function SettingsIndexPage() {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const { usage } = useBillingUsage()
  const groups = groupSettingsNavItems(
    filterSettingsNavItems(settingsNavItems, settingsNavFilterFromUsage(usage)),
  ).filter((group) => group.section !== 'overview')

  return (
    <Stack spacing={3}>
      {groups.map((group) => (
        <Box key={group.section}>
          <Typography
            variant="overline"
            sx={{
              display: 'block',
              mb: 1.5,
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: 'text.secondary',
            }}
          >
            {group.label}
          </Typography>
          <Grid container spacing={2}>
            {group.items.map((item) => {
              const locked = item.planLocked === true
              return (
                <Grid key={item.to} size={{ xs: 12, sm: 6 }}>
                  <Card
                    variant="outlined"
                    sx={{
                      borderRadius: 2.5,
                      height: '100%',
                      borderColor: locked
                        ? alpha('#b45309', isDark ? 0.35 : 0.28)
                        : isDark
                          ? alpha('#fff', 0.1)
                          : alpha('#0f172a', 0.08),
                      bgcolor: locked
                        ? alpha('#b45309', isDark ? 0.06 : 0.03)
                        : 'background.paper',
                      transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                      '&:hover': {
                        boxShadow: `0 8px 24px ${alpha('#0f172a', 0.08)}`,
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    <CardActionArea component={RouterLink} to={item.to} sx={{ height: '100%' }}>
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                          <Box
                            sx={{
                              p: 1.1,
                              borderRadius: 1.75,
                              bgcolor: locked
                                ? alpha('#b45309', 0.12)
                                : alpha(theme.palette.primary.main, 0.1),
                              color: locked ? '#b45309' : 'primary.main',
                              display: 'flex',
                            }}
                          >
                            {item.icon}
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.75,
                                flexWrap: 'wrap',
                                mb: 0.5,
                              }}
                            >
                              <Typography variant="subtitle1" fontWeight={700}>
                                {item.label}
                              </Typography>
                              {locked && <ProPlanBadge />}
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                              {item.description}
                            </Typography>
                            {locked && (
                              <Stack direction="row" alignItems="center" gap={0.5} sx={{ mt: 1 }}>
                                <LockOutlinedIcon sx={{ fontSize: 14, color: '#b45309' }} />
                                <Typography variant="caption" sx={{ color: '#b45309', fontWeight: 600 }}>
                                  Réservé au plan Pro
                                </Typography>
                              </Stack>
                            )}
                          </Box>
                          <ArrowForwardIcon fontSize="small" color="action" sx={{ mt: 0.5 }} />
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              )
            })}
          </Grid>
        </Box>
      ))}
    </Stack>
  )
}
