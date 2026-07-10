import { Box, Button, Card, CardContent, Chip, Container, Stack, Typography, alpha } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import { Link as RouterLink } from 'react-router-dom'
import { CATALOG_PACKS, CTA, PRICING_ADDONS_INTRO, PRICING_PLANS, PRICING_SECTION } from '../constants/siteContent'
import { GA_EVENTS, trackMarketingCtaClick } from '../../../config/analyticsEvents'
import { EfactureRoadmapAlert } from './EfactureRoadmapAlert'
import { ScrollReveal } from './ScrollReveal'
import { MARKETING_CONTRAST_BAND } from '../constants/marketingContrast'

function planCtaTo(planId: string): string {
  if (planId === 'pro' || planId === 'pro-efacture') return '/parametres/abonnement'
  if (planId === 'agency') return '/signup?plan=agency'
  return '/signup'
}

export function PricingCards() {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
        gap: 3,
        alignItems: 'stretch',
      }}
    >
      {PRICING_PLANS.map((plan) => (
        <Card
          key={plan.id}
          elevation={plan.highlighted ? 8 : 1}
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            border: plan.highlighted ? 2 : 1,
            borderColor:
              plan.id === 'pro-efacture'
                ? 'warning.main'
                : plan.highlighted
                  ? 'primary.main'
                  : 'divider',
            bgcolor:
              plan.id === 'pro-efacture'
                ? (t) => alpha(t.palette.warning.main, 0.06)
                : plan.highlighted
                  ? (t) => alpha(t.palette.primary.main, 0.04)
                  : 'background.paper',
            transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s ease',
            '&:hover': {
              transform: plan.highlighted ? 'translateY(-8px) scale(1.02)' : 'translateY(-6px)',
              boxShadow: 12,
            },
          }}
        >
          {plan.badge && (
            <Chip
              label={plan.badge}
              color={plan.id === 'pro-efacture' ? 'warning' : plan.highlighted ? 'primary' : 'default'}
              size="small"
              sx={{ position: 'absolute', top: 16, right: 16, fontWeight: 700 }}
            />
          )}
          <CardContent sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="overline" color="text.secondary">
              {plan.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, my: 1 }}>
              <Typography variant="h3" fontWeight={800}>
                {plan.price}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {plan.period}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 48 }}>
              {plan.description}
            </Typography>
            <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none', flexGrow: 1, mb: 3 }}>
              {plan.features.map((f) => (
                <Box
                  component="li"
                  key={f}
                  sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', py: 0.75 }}
                >
                  <CheckIcon sx={{ fontSize: 18, color: 'primary.main', mt: 0.25 }} />
                  <Typography variant="body2">{f}</Typography>
                </Box>
              ))}
            </Box>
            <Stack spacing={1}>
              <Button
                component={RouterLink}
                to={planCtaTo(plan.id)}
                variant={plan.highlighted || plan.id === 'pro-efacture' ? 'contained' : 'outlined'}
                color={plan.id === 'pro-efacture' ? 'warning' : 'primary'}
                fullWidth
                size="large"
                onClick={() =>
                  trackMarketingCtaClick({
                    event: GA_EVENTS.CTA_PRICING,
                    label: plan.cta,
                    destination: planCtaTo(plan.id),
                    section: `pricing_${plan.id}`,
                  })
                }
              >
                {plan.cta}
              </Button>
              <Button
                component={RouterLink}
                to={CTA.tryDemo.to}
                variant="text"
                color="inherit"
                fullWidth
                size="small"
                onClick={() =>
                  trackMarketingCtaClick({
                    event: GA_EVENTS.CTA_DEMO,
                    label: CTA.tryDemo.label,
                    destination: CTA.tryDemo.to,
                    section: `pricing_${plan.id}_demo`,
                  })
                }
              >
                {CTA.tryDemo.label}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Box>
  )
}

export function PricingAddonsSection() {
  return (
    <Box sx={{ mt: { xs: 8, md: 10 } }}>
      <ScrollReveal>
        <Typography variant="h2" sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 700, mb: 1, textAlign: 'center' }}>
          Options catalogue
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 560, mx: 'auto', mb: 4 }}>
          {PRICING_ADDONS_INTRO}
        </Typography>
      </ScrollReveal>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 3,
        }}
      >
        {CATALOG_PACKS.map((pack, i) => (
          <ScrollReveal key={pack.id} delayMs={i * 60}>
            <Card variant="outlined" sx={{ height: '100%', borderRadius: 3 }}>
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {pack.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 1 }}>
                  <Typography variant="h4" fontWeight={800} color="primary.main">
                    {pack.price}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {pack.priceNote}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, mb: 2 }}>
                  {pack.description}
                </Typography>
                <Button
                  component={RouterLink}
                  to="/signup"
                  variant="outlined"
                  fullWidth
                  onClick={() =>
                    trackMarketingCtaClick({
                      event: GA_EVENTS.CTA_SIGNUP,
                      label: pack.cta,
                      destination: '/signup',
                      section: `pricing_pack_${pack.id}`,
                    })
                  }
                >
                  {pack.cta}
                </Button>
              </CardContent>
            </Card>
          </ScrollReveal>
        ))}
      </Box>
    </Box>
  )
}

export function PricingSection({
  showTitle = true,
  contrastBand = false,
}: {
  showTitle?: boolean
  contrastBand?: boolean
}) {
  return (
    <Box
      sx={{
        py: { xs: 8, md: 10 },
        ...(contrastBand
          ? {
              background: MARKETING_CONTRAST_BAND.pricing.background,
              borderTop: MARKETING_CONTRAST_BAND.pricing.borderTop,
            }
          : {}),
      }}
    >
      <Container maxWidth="lg">
        {showTitle && (
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '1.75rem', md: '2.25rem' },
                fontWeight: 700,
                mb: 1.5,
                color: contrastBand ? MARKETING_CONTRAST_BAND.pricing.titleColor : 'text.primary',
              }}
            >
              {PRICING_SECTION.title}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 400,
                maxWidth: 600,
                mx: 'auto',
                color: contrastBand ? 'text.secondary' : 'text.secondary',
              }}
            >
              {PRICING_SECTION.subtitle}
            </Typography>
          </Box>
        )}
        <EfactureRoadmapAlert sx={{ mb: 4, maxWidth: 720, mx: 'auto' }} />
        <PricingCards />
        <PricingAddonsSection />
      </Container>
    </Box>
  )
}
