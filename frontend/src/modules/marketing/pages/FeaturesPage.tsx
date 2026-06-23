import { Box, Button, Container, Typography, alpha } from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { Link as RouterLink } from 'react-router-dom'
import { MarketingHero } from '../components/MarketingHero'
import { FeatureGrid } from '../components/FeatureGrid'
import { CtaSection } from '../components/CtaSection'
import { ScrollReveal } from '../components/ScrollReveal'
import { MarketingImage } from '../components/MarketingImage'
import { EfactureRoadmapAlert } from '../components/EfactureRoadmapAlert'
import { BetaTesterPromo } from '../components/BetaTesterPromo'
import {
  CTA,
  FEATURES,
  FEATURES_COMMERCIAL,
  FEATURES_COMPTA,
  FEATURES_ROADMAP,
  FREE_PLAN_SUMMARY,
} from '../constants/siteContent'

export function FeaturesPage() {
  return (
    <Box>
      <MarketingHero
        compact
        badge="Déjà dispo · Bientôt · En préparation"
        title="Tout pour vendre et facturer, sans usine à gaz"
        subtitle="Devis, factures, paiement en ligne, TVA et suivi basique — plus ce qu'il faut pour préparer 2026. Pas de synchro bancaire : on reste simple."
        primaryCta={CTA.signupFree}
        secondaryCta={CTA.efacture2026}
        visual={<MarketingImage src="/images/facturio-features.png" alt="Fonctionnalités PrestaFacture" float={false} />}
      />

      <BetaTesterPromo compact />

      <FeatureGrid
        title="Au quotidien"
        subtitle="Ce que vous utilisez chaque semaine pour chiffrer et encaisser."
        features={FEATURES}
      />

      <FeatureGrid
        title="Abonnements & forfaits"
        subtitle="Inclus dès le plan Pro — maintenance mensuelle, packs et liens à envoyer au client."
        features={FEATURES_COMMERCIAL}
      />

      <FeatureGrid
        title="Suivi & exports"
        subtitle="Le minimum pour suivre votre activité et tenir votre comptable au courant."
        features={FEATURES_COMPTA}
      />

      <Box sx={{ bgcolor: (t) => alpha(t.palette.warning.main, 0.08), py: { xs: 6, md: 8 } }}>
        <Container maxWidth="lg">
          <ScrollReveal>
            <Typography variant="h2" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '1.5rem', md: '2rem' }, textAlign: 'center' }}>
              Préparer 2026 — ce qui arrive
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
        title={`Testez gratuitement — ${FREE_PLAN_SUMMARY}`}
        subtitle="Passez Pro pour l'illimité et les exports. Réservez Pro + e-facture pour être prêt avant septembre 2026."
        primaryLabel={CTA.signupFree.label}
        primaryTo={CTA.signupFree.to}
        secondaryLabel={CTA.betaSignup.label}
        secondaryTo={CTA.betaSignup.to}
      />
    </Box>
  )
}
