import type { ReactNode } from 'react'
import { Box, Container, Typography, Button, Chip, Stack } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { keyframes } from '@mui/system'
import { FloatingOrbs } from './FloatingOrbs'
import type { MarketingCta } from '../constants/siteContent'
import { GA_EVENTS, trackMarketingCtaClick } from '../../../config/analyticsEvents'

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`

type MarketingHeroProps = {
  title: ReactNode
  subtitle: string
  badge?: string
  primaryCta?: MarketingCta
  secondaryCta?: MarketingCta | null
  /** Zone GA4 (hero, landing_hero, etc.) */
  analyticsSection?: string
  compact?: boolean
  visual?: ReactNode
}

export function MarketingHero({
  title,
  subtitle,
  badge,
  primaryCta = { label: 'Commencer gratuitement', to: '/signup' },
  secondaryCta = { label: 'Voir les tarifs', to: '/tarifs' },
  compact = false,
  visual,
  analyticsSection = 'hero',
}: MarketingHeroProps) {
  const showSecondary = secondaryCta != null

  const handleCtaClick = (cta: MarketingCta, role: 'primary' | 'secondary'): void => {
    const event =
      cta.gaEvent ?? (role === 'primary' ? GA_EVENTS.CTA_SIGNUP_HERO : GA_EVENTS.CTA_SIGNUP)
    trackMarketingCtaClick({
      event,
      label: cta.label,
      destination: cta.to,
      section: analyticsSection,
    })
  }

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 42%, #134e4a 100%)',
        color: 'white',
        py: compact ? { xs: 6, md: 8 } : { xs: 8, md: 12 },
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <FloatingOrbs />
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: visual ? 'row' : 'column' },
            alignItems: 'center',
            gap: { xs: 4, md: 6 },
          }}
        >
          <Box
            sx={{
              flex: 1,
              maxWidth: visual ? 560 : 720,
              animation: `${fadeInUp} 0.65s ease-out`,
              textAlign: { xs: 'center', md: visual ? 'left' : 'center' },
            }}
          >
            {badge && (
              <Chip
                label={badge}
                size="small"
                sx={{
                  mb: 2,
                  bgcolor: 'rgba(255,255,255,0.18)',
                  color: 'white',
                  fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.25)',
                }}
              />
            )}
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2rem', sm: '2.5rem', md: compact ? '2.5rem' : '3.25rem' },
                fontWeight: 800,
                lineHeight: 1.15,
                mb: 2,
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontSize: { xs: '1rem', md: '1.2rem' },
                opacity: 0.95,
                fontWeight: 400,
                lineHeight: 1.6,
                mb: 4,
              }}
            >
              {subtitle}
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              flexWrap="wrap"
              justifyContent={{ xs: 'center', md: visual ? 'flex-start' : 'center' }}
            >
              <Button
                component={RouterLink}
                to={primaryCta.to}
                variant="contained"
                size="large"
                onClick={() => handleCtaClick(primaryCta, 'primary')}
                sx={{
                  bgcolor: 'white',
                  color: '#0f766e',
                  fontWeight: 600,
                  px: 3.5,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.92)' },
                }}
              >
                {primaryCta.label}
              </Button>
              {showSecondary && secondaryCta && (
                <Button
                  component={RouterLink}
                  to={secondaryCta.to}
                  variant="outlined"
                  size="large"
                  onClick={() => handleCtaClick(secondaryCta, 'secondary')}
                  sx={{
                    borderColor: 'rgba(255,255,255,0.75)',
                    color: 'white',
                    px: 3.5,
                    '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
                  }}
                >
                  {secondaryCta.label}
                </Button>
              )}
            </Stack>
          </Box>
          {visual && (
            <Box sx={{ flex: 1, width: '100%', maxWidth: 440, animation: `${fadeInUp} 0.8s ease-out 0.15s both` }}>
              {visual}
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  )
}
