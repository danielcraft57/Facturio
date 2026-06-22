import { Box, Container, Typography, Alert, Link } from '@mui/material'
import { MarketingHero } from '../components/MarketingHero'
import { ReformTimeline } from '../components/ReformTimeline'
import { CtaSection } from '../components/CtaSection'
import { ScrollReveal } from '../components/ScrollReveal'
import { MarketingImage } from '../components/MarketingImage'
import { BetaTesterPromo } from '../components/BetaTesterPromo'
import { CTA, REFORM_DATES } from '../constants/siteContent'
import { EfactureRoadmapAlert } from '../components/EfactureRoadmapAlert'
import { ReformScheduleSimulator } from '../components/ReformScheduleSimulator'

const APPROACH = [
  {
    title: 'Vous restez dans PrestaFacture',
    body: 'Catalogue, devis, missions et factures : aucun changement d’habitudes pour le métier.',
  },
  {
    title: 'Export Factur-X (XML)',
    body: 'Format structuré EN 16931 disponible dès le palier Pro + e-facture — base documentaire avant toute transmission PA.',
  },
  {
    title: 'Plateforme Agréée partenaire',
    body: 'Connecteur en cours de développement : pas d’envoi PA dans l’app aujourd’hui. Le palier Pro + e-facture réserve l’accès à l’activation.',
  },
  {
    title: 'E-reporting',
    body: 'Flux complémentaires (B2C, international, encaissements) : module annoncé sur la feuille de route, non livré.',
  },
] as const

export function ElectronicInvoicingPage() {
  return (
    <Box>
      <MarketingHero
        compact
        badge={`Échéance ${REFORM_DATES.reception}`}
        title="Facturation électronique : anticipez sans stress"
        subtitle="La réforme B2B française concerne vos factures clients entreprises. PrestaFacture prépare la conformité tout en restant votre outil métier vertical."
        primaryCta={CTA.reserveEfacture}
        secondaryCta={CTA.signupFree}
        visual={<MarketingImage src="/images/facturio-efacture.png" alt="Schéma facturation électronique 2026" float={false} />}
      />

      <BetaTesterPromo compact />

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
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
            gap: 3,
            alignItems: 'start',
          }}
        >
          <Box>
            <ScrollReveal>
              <Typography variant="h2" sx={{ fontWeight: 700, mb: 4, fontSize: { xs: '1.5rem', md: '2rem' } }}>
                Calendrier officiel
              </Typography>
            </ScrollReveal>
            <ReformTimeline />
          </Box>
          <ScrollReveal delayMs={80}>
            <ReformScheduleSimulator />
          </ScrollReveal>
        </Box>
      </Container>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <ScrollReveal>
          <Typography variant="h2" sx={{ fontWeight: 700, mb: 4, fontSize: { xs: '1.5rem', md: '2rem' } }}>
            L&apos;approche PrestaFacture
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
