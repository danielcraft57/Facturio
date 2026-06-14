import { Link as RouterLink } from 'react-router-dom'
import { Box, Card, CardActionArea, CardContent, Grid, Typography, alpha } from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { filterSettingsNavItems, settingsNavItems, settingsNavFilterFromUsage } from '../settingsNav'
import { useBillingUsage } from '../../../hooks/useBillingUsage'

export function SettingsIndexPage() {
  const { usage } = useBillingUsage()
  const cards = filterSettingsNavItems(settingsNavItems, settingsNavFilterFromUsage(usage)).filter(
    (i) => i.to !== '/parametres',
  )

  return (
    <Grid container spacing={2}>
      {cards.map((item) => (
        <Grid key={item.to} size={{ xs: 12, sm: 6 }}>
          <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
            <CardActionArea component={RouterLink} to={item.to} sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 1.5,
                      bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
                      color: 'primary.main',
                      display: 'flex',
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {item.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {item.description}
                    </Typography>
                  </Box>
                  <ArrowForwardIcon fontSize="small" color="action" />
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}
