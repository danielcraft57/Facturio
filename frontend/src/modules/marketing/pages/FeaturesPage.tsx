import { Box, Container, Typography } from '@mui/material'
import { MarketingHero } from '../components/MarketingHero'
import { FeatureGrid } from '../components/FeatureGrid'
import { CtaSection } from '../components/CtaSection'
import { ScrollReveal } from '../components/ScrollReveal'
import { MarketingImage } from '../components/MarketingImage'
import { FEATURES } from '../constants/siteContent'

const EXTRA = [
  {
    title: 'Prospection & OSINT',
    description: 'Enrichissement des fiches prospects et campagnes (module en évolution).',
  },
  {
    title: 'Abonnements & MRR',
    description: 'Plans récurrents pour maintenance et licences SaaS livrées au client.',
  },
  {
    title: 'Avoirs & compta',
    description: 'Notes de crédit, écritures automatiques, balance et export FEC.',
  },
  {
    title: 'Quotas par plan',
    description: 'API billing/usage : le plan Free plafonne les factures mensuelles.',
  },
] as const

export function FeaturesPage() {
  return (
    <Box>
      <MarketingHero
        compact
        title="Fonctionnalités"
        subtitle="Cycle commercial complet pour prestataires du numérique, avec limites freemium côté serveur."
        primaryCta={{ label: 'Créer un compte', to: '/signup' }}
        secondaryCta={{ label: 'Tarifs', to: '/tarifs' }}
        visual={<MarketingImage src="/images/facturio-features.png" alt="Fonctionnalités Facturio" float={false} />}
      />

      <FeatureGrid features={FEATURES} />

      <Container maxWidth="lg" sx={{ pb: 8 }}>
        <ScrollReveal>
          <Typography variant="h2" sx={{ fontWeight: 700, mb: 4, fontSize: { xs: '1.5rem', md: '2rem' } }}>
            Et aussi
          </Typography>
        </ScrollReveal>
        <FeatureGrid title={null} features={EXTRA} />
      </Container>

      <CtaSection />
    </Box>
  )
}
