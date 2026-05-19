import { Box, Container, Typography, Alert } from '@mui/material'
import { MarketingHero } from '../components/MarketingHero'
import { PricingSection } from '../components/PricingCards'
import { CtaSection } from '../components/CtaSection'
import { ScrollReveal } from '../components/ScrollReveal'
import { MarketingImage } from '../components/MarketingImage'

const FAQ = [
  {
    q: 'Comment limiter l’accès sur le plan Free ?',
    a: 'Dès maintenant : maximum 10 factures créées par mois et calendrier. Au-delà, l’API renvoie une erreur et l’app affiche une invitation à passer Pro.',
  },
  {
    q: 'Pourquoi un palier « Pro + e-facture » ?',
    a: 'La réforme impose le passage par une Plateforme Agréée. Ce palier réservera l’accès au connecteur PA et à Factur-X dès leur mise en production (module en développement).',
  },
  {
    q: 'Facturio remplace ma compta ?',
    a: 'Non. Facturation verticale + bases comptables. Export FEC vers votre expert-comptable.',
  },
] as const

export function PricingPage() {
  return (
    <Box>
      <MarketingHero
        compact
        title="Tarifs transparents"
        subtitle="Freemium pour acquérir, Pro pour le métier (prospection incluse). Le palier e-facture réserve le module PA (en développement)."
        primaryCta={{ label: 'Commencer gratuitement', to: '/signup' }}
        secondaryCta={{ label: 'Se connecter', to: '/login' }}
        visual={<MarketingImage src="/images/facturio-pricing.png" alt="Paliers tarifaires Facturio" float={false} />}
      />

      <Container maxWidth="lg" sx={{ py: 3 }}>
        <ScrollReveal>
          <Alert severity="success" sx={{ borderRadius: 2 }}>
            <strong>Dogfooding DanielCraft</strong> — Facturio facture les prestations du site. Plan Free : 10 factures /
            mois ; Pro : illimité (champ <code>saasPlan</code> sur l&apos;organisation).
          </Alert>
        </ScrollReveal>
      </Container>

      <PricingSection showTitle={false} />

      <Container maxWidth="md" sx={{ py: 8 }}>
        <ScrollReveal>
          <Typography variant="h2" sx={{ fontWeight: 700, mb: 4, textAlign: 'center', fontSize: { xs: '1.5rem', md: '2rem' } }}>
            Questions fréquentes
          </Typography>
        </ScrollReveal>
        {FAQ.map((item, i) => (
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

      <CtaSection />
    </Box>
  )
}
