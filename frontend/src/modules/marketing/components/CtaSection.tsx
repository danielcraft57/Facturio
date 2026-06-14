import { Box, Button, Container, Paper, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { MARKETING_CTA } from '../constants/siteContent'
import { GA_EVENTS, trackMarketingCtaClick } from '../../../config/analyticsEvents'

type CtaSectionProps = {
  title?: string
  subtitle?: string
  primaryLabel?: string
  primaryTo?: string
  primaryGaEvent?: string
  secondaryLabel?: string
  secondaryTo?: string
  secondaryGaEvent?: string
  /** Zone GA4 (cta_band, landing_footer, etc.) */
  analyticsSection?: string
}

export function CtaSection({
  title = MARKETING_CTA.defaultTitle,
  subtitle = MARKETING_CTA.defaultSubtitle,
  primaryLabel = 'Créer mon compte gratuit',
  primaryTo = '/signup',
  primaryGaEvent = GA_EVENTS.CTA_SIGNUP,
  secondaryLabel,
  secondaryTo,
  secondaryGaEvent,
  analyticsSection = 'cta_band',
}: CtaSectionProps) {
  return (
    <Box sx={{ py: { xs: 8, md: 10 } }}>
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 6 },
            textAlign: 'center',
            borderRadius: 4,
            background: (t) =>
              `linear-gradient(135deg, ${t.palette.primary.main} 0%, ${t.palette.primary.dark} 100%)`,
            color: 'white',
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            {title}
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, opacity: 0.95, maxWidth: 480, mx: 'auto' }}>
            {subtitle}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
            <Button
              component={RouterLink}
              to={primaryTo}
              variant="contained"
              size="large"
              onClick={() =>
                trackMarketingCtaClick({
                  event: primaryGaEvent,
                  label: primaryLabel,
                  destination: primaryTo,
                  section: analyticsSection,
                })
              }
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                fontWeight: 600,
                px: 4,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.92)' },
              }}
            >
              {primaryLabel}
            </Button>
            {secondaryLabel && secondaryTo && (
              <Button
                component={RouterLink}
                to={secondaryTo}
                variant="outlined"
                size="large"
                onClick={() =>
                  trackMarketingCtaClick({
                    event: secondaryGaEvent ?? GA_EVENTS.CTA_SIGNUP,
                    label: secondaryLabel,
                    destination: secondaryTo,
                    section: analyticsSection,
                  })
                }
                sx={{
                  borderColor: 'rgba(255,255,255,0.8)',
                  color: 'white',
                  fontWeight: 600,
                  '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
                }}
              >
                {secondaryLabel}
              </Button>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}
