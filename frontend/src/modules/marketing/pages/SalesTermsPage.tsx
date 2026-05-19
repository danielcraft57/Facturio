import { Container, Alert, Box, Link } from '@mui/material'
import { MarketingHero } from '../components/MarketingHero'
import { LegalSections } from '../../legal/LegalSections'
import { LegalPublisherCard } from '../../legal/LegalPublisherCard'
import { SALES_TERMS_SECTIONS } from '../../legal/content'
import { DANIELCRAFT_PUBLISHER } from '../../legal/danielcraftPublisher'

export function SalesTermsPage() {
  return (
    <Box>
      <MarketingHero
        compact
        title="Conditions générales de vente"
        subtitle="Abonnements Facturio et options payantes."
        secondaryCta={null}
      />
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          CGV applicables aux offres SaaS Facturio. Pour les prestations de développement sur{' '}
          <Link href={DANIELCRAFT_PUBLISHER.website} target="_blank" rel="noopener noreferrer">
            {DANIELCRAFT_PUBLISHER.websiteLabel}
          </Link>
          , voir les{' '}
          <Link
            href={`${DANIELCRAFT_PUBLISHER.website}/cgv`}
            target="_blank"
            rel="noopener noreferrer"
          >
            CGV DanielCraft
          </Link>
          .
        </Alert>
        <LegalPublisherCard />
        <LegalSections sections={SALES_TERMS_SECTIONS} />
      </Container>
    </Box>
  )
}
