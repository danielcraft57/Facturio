import { Box, Container, Typography, Alert, Link } from '@mui/material'
import { MarketingHero } from '../components/MarketingHero'
import { ReformTimeline } from '../components/ReformTimeline'
import { CtaSection } from '../components/CtaSection'
import { ScrollReveal } from '../components/ScrollReveal'
import { MarketingImage } from '../components/MarketingImage'
import { REFORM_DATES } from '../constants/siteContent'
import { EfactureRoadmapAlert } from '../components/EfactureRoadmapAlert'

const APPROACH = [
  {
    title: 'Vous restez dans Facturio',
    body: 'Catalogue, devis, missions et factures : aucun changement d’habitudes pour le métier.',
  },
  {
    title: 'Factur-X généré automatiquement',
    body: 'Format structuré EN 16931, prêt pour la transmission réglementaire (feuille de route produit).',
  },
  {
    title: 'Plateforme Agréée partenaire',
    body: 'Pas d’immatriculation lourde côté Facturio : connexion à une PA pour le réseau officiel et la DGFiP.',
  },
  {
    title: 'E-reporting',
    body: 'Paiements Stripe, B2C et flux hors facture électronique : agrégation prévue pour les obligations complémentaires.',
  },
] as const

export function ElectronicInvoicingPage() {
  return (
    <Box>
      <MarketingHero
        compact
        badge={`Échéance ${REFORM_DATES.reception}`}
        title="Facturation électronique : anticipez sans stress"
        subtitle="La réforme B2B française concerne vos factures clients entreprises. Facturio prépare la conformité tout en restant votre outil métier vertical."
        primaryCta={{ label: 'Plan Pro + e-facture', to: '/tarifs' }}
        secondaryCta={{ label: 'Créer un compte', to: '/signup' }}
        visual={<MarketingImage src="/images/facturio-efacture.png" alt="Schéma facturation électronique 2026" float={false} />}
      />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ScrollReveal>
          <EfactureRoadmapAlert sx={{ mb: 2 }} />
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Obligation de <strong>réception</strong> pour toutes les entreprises TVA au {REFORM_DATES.reception}.
            Obligation d&apos;<strong>émission</strong> pour les ETI et grandes entreprises à la même date, puis PME et
            micro au {REFORM_DATES.emissionPme}.{' '}
            <Link href="https://www.impots.gouv.fr/facturation-electronique-et-plateformes-agreees" target="_blank" rel="noopener">
              Source impots.gouv.fr
            </Link>
          </Alert>
        </ScrollReveal>
      </Container>

      <Container maxWidth="lg" sx={{ pb: 2 }}>
        <ScrollReveal>
          <Typography variant="h2" sx={{ fontWeight: 700, mb: 4, fontSize: { xs: '1.5rem', md: '2rem' } }}>
            Calendrier
          </Typography>
        </ScrollReveal>
      </Container>
      <ReformTimeline />

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <ScrollReveal>
          <Typography variant="h2" sx={{ fontWeight: 700, mb: 4, fontSize: { xs: '1.5rem', md: '2rem' } }}>
            L&apos;approche Facturio
          </Typography>
        </ScrollReveal>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
          {APPROACH.map((item, i) => (
            <ScrollReveal key={item.title} delayMs={i * 60}>
              <Box sx={{ p: 3, borderRadius: 3, border: 1, borderColor: 'divider', height: '100%' }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.body}
                </Typography>
              </Box>
            </ScrollReveal>
          ))}
        </Box>
      </Container>

      <CtaSection
        title="Soyez prêt avant septembre 2026"
        subtitle="Le plan Pro + e-facture regroupera la connexion PA dès que le module sera livré."
        primaryLabel="Comparer les offres"
        primaryTo="/tarifs"
      />
    </Box>
  )
}
