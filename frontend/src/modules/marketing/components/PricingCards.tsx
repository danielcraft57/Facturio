import { Box, Button, Card, CardContent, Chip, Container, Typography, alpha } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import { Link as RouterLink } from 'react-router-dom'
import { PRICING_PLANS } from '../constants/siteContent'
import { EfactureRoadmapAlert } from './EfactureRoadmapAlert'

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
            borderColor: plan.highlighted ? 'primary.main' : 'divider',
            bgcolor: plan.highlighted ? (t) => alpha(t.palette.primary.main, 0.04) : 'background.paper',
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
              color="warning"
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
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
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
            <Button
              component={RouterLink}
              to={plan.id === 'agency' ? '/signup' : '/signup'}
              variant={plan.highlighted ? 'contained' : 'outlined'}
              fullWidth
              size="large"
            >
              {plan.cta}
            </Button>
          </CardContent>
        </Card>
      ))}
    </Box>
  )
}

export function PricingSection({ showTitle = true }: { showTitle?: boolean }) {
  return (
    <Box sx={{ py: { xs: 8, md: 10 } }}>
      <Container maxWidth="lg">
        {showTitle && (
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h2" sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' }, fontWeight: 700, mb: 1.5 }}>
              Tarifs simples, sans surprise
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, maxWidth: 520, mx: 'auto' }}>
              Freemium pour les prestataires du numérique. Prospection et factures illimitées dès le plan Pro.
            </Typography>
          </Box>
        )}
        <EfactureRoadmapAlert sx={{ mb: 4, maxWidth: 720, mx: 'auto' }} />
        <PricingCards />
      </Container>
    </Box>
  )
}
