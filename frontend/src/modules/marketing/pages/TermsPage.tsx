import { Container, Alert, Box, Link } from '@mui/material'
import { MarketingHero } from '../components/MarketingHero'
import { LegalSections } from '../../legal/LegalSections'
import { LegalPublisherCard } from '../../legal/LegalPublisherCard'
import { TERMS_SECTIONS } from '../../legal/content'
import { DANIELCRAFT_PUBLISHER } from '../../legal/danielcraftPublisher'

export function TermsPage() {
  return (
    <Box>
      <MarketingHero
        compact
        title="Conditions générales d'utilisation"
        subtitle="Règles d'usage du service PrestaFacture."
        secondaryCta={null}
      />
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          En créant un compte, vous acceptez les présentes CGU, la{' '}
          <Link href="/privacy">politique de confidentialité</Link> et, pour tout abonnement payant, les{' '}
          <Link href="/cgv">CGV</Link>. Le module e-facture 2026 (PA) est en cours de développement.
        </Alert>
        <LegalPublisherCard />
        <LegalSections sections={TERMS_SECTIONS} />
        <Alert severity="info" sx={{ mt: 4, borderRadius: 2 }}>
          CGU du site vitrine :{' '}
          <Link href={`${DANIELCRAFT_PUBLISHER.website}/cgu`} target="_blank" rel="noopener noreferrer">
            {DANIELCRAFT_PUBLISHER.websiteLabel}/cgu
          </Link>
        </Alert>
      </Container>
    </Box>
  )
}
