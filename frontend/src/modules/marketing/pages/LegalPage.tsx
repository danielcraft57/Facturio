import { Container, Typography, Box, Alert, Link } from '@mui/material'
import { MarketingHero } from '../components/MarketingHero'
import { LegalSections } from '../../legal/LegalSections'
import { LegalPublisherCard } from '../../legal/LegalPublisherCard'
import { LEGAL_MENTIONS_SECTIONS } from '../../legal/content'
import { DANIELCRAFT_PUBLISHER, PRESTAFACTURE_SERVICE } from '../../legal/danielcraftPublisher'

export function LegalPage() {
  return (
    <Box>
      <MarketingHero
        compact
        title="Mentions légales"
        subtitle={`Service ${PRESTAFACTURE_SERVICE.name} — édité par ${DANIELCRAFT_PUBLISHER.tradeName}.`}
        secondaryCta={null}
      />
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          Conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l&apos;économie numérique
          (LCEN). Informations alignées sur{' '}
          <Link href={`${DANIELCRAFT_PUBLISHER.website}/mentions-legales`} target="_blank" rel="noopener noreferrer">
            {DANIELCRAFT_PUBLISHER.websiteLabel}
          </Link>
          .
        </Alert>
        <LegalPublisherCard />
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 3 }}>
          Dernière mise à jour PrestaFacture : {DANIELCRAFT_PUBLISHER.prestafactureLegalUpdated}
        </Typography>
        <LegalSections sections={LEGAL_MENTIONS_SECTIONS} />
      </Container>
    </Box>
  )
}
