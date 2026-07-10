import { Box, Button, Container, Typography, Alert, Grid, Card, CardContent, alpha } from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { Link as RouterLink } from 'react-router-dom'
import { MarketingHero } from '../components/MarketingHero'
import { PricingSection } from '../components/PricingCards'
import { CtaSection } from '../components/CtaSection'
import { ScrollReveal } from '../components/ScrollReveal'
import { MarketingImage } from '../components/MarketingImage'
import { BetaTesterPromo } from '../components/BetaTesterPromo'
import { CTA, FREE_PLAN_SUMMARY, MARKETING_CTA, PRICING_FAQ, REFORM_DATES } from '../constants/siteContent'
import { GA_EVENTS } from '../../../config/analyticsEvents'

export function PricingPage() {
  return (
    <Box>
      <MarketingHero
        compact
        badge="Free · Pro · Pro + e-facture · Agence"
        title="Des tarifs simples"
        subtitle="Gratuit pour tester. Pro pour le quotidien. Pro + e-facture pour être prêt avant septembre 2026 — sans payer une grosse compta."
        primaryCta={CTA.signupFree}
        secondaryCta={CTA.reserveEfacture}
        visual={<MarketingImage src="/images/facturio-pricing.jpg" alt="Paliers tarifaires PrestaFacture" float={false} />}
      />

      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <ScrollReveal>
              <Alert severity="success" sx={{ borderRadius: 2, height: '100%' }}>
                <strong>Plan Free</strong> — {FREE_PLAN_SUMMARY}. Pro : pas de limite sur les devis et factures.
              </Alert>
            </ScrollReveal>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <ScrollReveal delayMs={60}>
              <Alert severity="warning" sx={{ borderRadius: 2, height: '100%' }}>
                <strong>Rappel 2026</strong> — Réception des factures électroniques pour toutes les structures TVA dès le{' '}
                {REFORM_DATES.reception}. Émission pour les micro et PME : {REFORM_DATES.emissionPme}.
              </Alert>
            </ScrollReveal>
          </Grid>
        </Grid>
      </Container>

      <BetaTesterPromo compact />

      <PricingSection showTitle={false} />

      <Container maxWidth="md" sx={{ py: 4 }}>
        <ScrollReveal>
          <Card
            sx={{
              borderRadius: 3,
              bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
              border: 1,
              borderColor: 'divider',
            }}
          >
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Pas sûr de votre échéance ?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 480, mx: 'auto' }}>
                Consultez la page dédiée : calendrier, indicateur de conformité et offre Pro + e-facture.
              </Typography>
              <Button
                component={RouterLink}
                to={CTA.efacture2026.to}
                variant="contained"
                endIcon={<ArrowForwardIcon />}
              >
                {CTA.efacture2026.label}
              </Button>
            </CardContent>
          </Card>
        </ScrollReveal>
      </Container>

      <Container maxWidth="md" sx={{ py: 8 }}>
        <ScrollReveal>
          <Typography variant="h2" sx={{ fontWeight: 700, mb: 4, textAlign: 'center', fontSize: { xs: '1.5rem', md: '2rem' } }}>
            Questions fréquentes
          </Typography>
        </ScrollReveal>
        {PRICING_FAQ.map((item, i) => (
          <ScrollReveal key={item.q} delayMs={i * 50}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                {item.q}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {item.a}
              </Typography>
            </Box>
          </ScrollReveal>
        ))}
      </Container>

      <CtaSection
        title={MARKETING_CTA.pricingTitle}
        subtitle={MARKETING_CTA.pricingSubtitle}
        primaryLabel={CTA.signupFree.label}
        primaryTo={CTA.signupFree.to}
        secondaryLabel={CTA.tryDemo.label}
        secondaryTo={CTA.tryDemo.to}
        secondaryGaEvent={GA_EVENTS.CTA_DEMO}
        tertiaryLabel={CTA.betaSignup.label}
        tertiaryTo={CTA.betaSignup.to}
        tertiaryGaEvent={GA_EVENTS.CTA_BETA}
      />
    </Box>
  )
}
