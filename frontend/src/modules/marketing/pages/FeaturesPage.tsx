import { Box, Button, Container, Typography, alpha } from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { Link as RouterLink } from 'react-router-dom'
import { MarketingHero } from '../components/MarketingHero'
import { FeatureGrid } from '../components/FeatureGrid'
import { CtaSection } from '../components/CtaSection'
import { ScrollReveal } from '../components/ScrollReveal'
import { MarketingImage } from '../components/MarketingImage'
import { EfactureRoadmapAlert } from '../components/EfactureRoadmapAlert'
import {
  CTA,
  FEATURES,
  FEATURES_COMMERCIAL,
  FEATURES_COMPTA,
  FEATURES_ROADMAP,
} from '../constants/siteContent'

export function FeaturesPage() {
  return (
    <Box>
      <MarketingHero
        compact
        badge="Disponible · En cours · À venir"
        title="Tout le cycle commercial, sans la compta lourde"
        subtitle="Devis, factures, Stripe, TVA, prospection et pré-compta — plus la couche conformité 2026. Pas de sync bancaire : on reste léger."
        primaryCta={CTA.signupFree}
        secondaryCta={CTA.efacture2026}
        visual={<MarketingImage src="/images/facturio-features.png" alt="Fonctionnalités Facturio" float={false} />}
      />

      <FeatureGrid
        title="Cœur métier"
        subtitle="Ce que vous utilisez chaque semaine pour facturer vos missions."
        features={FEATURES}
      />

      <FeatureGrid
        title="Commercial & récurrence"
        subtitle="Inclus dès le plan Pro — pour développer votre pipeline et vos abonnements maintenance."
        features={FEATURES_COMMERCIAL}
      />

      <FeatureGrid
        title="Pré-compta & exports"
        subtitle="Le minimum pour suivre votre activité et alimenter votre expert-comptable."
        features={FEATURES_COMPTA}
      />

      <Box sx={{ bgcolor: (t) => alpha(t.palette.warning.main, 0.08), py: { xs: 6, md: 8 } }}>
        <Container maxWidth="lg">
          <ScrollReveal>
            <Typography variant="h2" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '1.5rem', md: '2rem' }, textAlign: 'center' }}>
              Conformité 2026 & feuille de route
            </Typography>
            <EfactureRoadmapAlert sx={{ mb: 4, maxWidth: 720, mx: 'auto' }} />
          </ScrollReveal>
          <FeatureGrid title={null} features={FEATURES_ROADMAP} />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2, mt: 2 }}>
            <Button
              component={RouterLink}
              to={CTA.reserveEfacture.to}
              variant="contained"
              color="warning"
              endIcon={<ArrowForwardIcon />}
            >
              {CTA.reserveEfacture.label}
            </Button>
            <Button component={RouterLink} to={CTA.efacture2026.to} variant="outlined">
              {CTA.efacture2026.label}
            </Button>
          </Box>
        </Container>
      </Box>

      <CtaSection
        title="Testez gratuitement — 25 factures/mois"
        subtitle="Passez Pro pour l’illimité et ProspectLab. Réservez Pro + e-facture pour verrouiller la conformité PA."
        primaryLabel={CTA.signupFree.label}
        primaryTo={CTA.signupFree.to}
        secondaryLabel={CTA.pricing.label}
        secondaryTo={CTA.pricing.to}
      />
    </Box>
  )
}
