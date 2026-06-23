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
    body: 'Catalogue, devis, missions et factures : pas besoin de changer d\'outil pour votre quotidien.',
  },
  {
    title: 'Contrôles de conformité',
    body: 'SIRET, SIREN client, mentions légales… un indicateur vous dit ce qui manque avant l\'envoi officiel.',
  },
  {
    title: 'Connexion à la plateforme officielle',
    body: 'En cours de développement : pas d\'envoi automatique dans l\'app pour l\'instant. L\'offre Pro + e-facture vous réserve la place.',
  },
  {
    title: 'Déclarations complémentaires',
    body: 'Les flux prévus par la loi (ventes B2C, international, encaissements) sont sur la feuille de route — pas encore livrés.',
  },
] as const

export function ElectronicInvoicingPage() {
  return (
    <Box>
      <MarketingHero
        compact
        badge={`Échéance ${REFORM_DATES.reception}`}
        title="Facturation électronique : anticipez sans stress"
        subtitle="La réforme concerne vos factures clients entreprises. PrestaFacture vous aide à vous y préparer, sans quitter votre outil habituel."
        primaryCta={CTA.reserveEfacture}
        secondaryCta={CTA.signupFree}
        visual={<MarketingImage src="/images/facturio-efacture.png" alt="Schéma facturation électronique 2026" float={false} />}
      />

      <BetaTesterPromo compact />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ScrollReveal>
          <EfactureRoadmapAlert sx={{ mb: 2 }} />
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            À partir du {REFORM_DATES.reception}, toutes les entreprises assujetties à la TVA devront{' '}
            <strong>recevoir</strong> des factures électroniques. L&apos;<strong>émission</strong> concerne
            d&apos;abord les grosses structures à la même date, puis les PME et micro au{' '}
            {REFORM_DATES.emissionPme}.{' '}
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
        subtitle="L'offre Pro + e-facture regroupera la connexion officielle dès que le module sera prêt."
        primaryLabel="Comparer les offres"
        primaryTo="/tarifs"
      />
    </Box>
  )
}
