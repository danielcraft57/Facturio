import { Container, Typography, Box, Alert } from '@mui/material'
import { MarketingHero } from '../components/MarketingHero'
import { LegalSections } from '../../legal/LegalSections'
import { LEGAL_CONTROLLER, PRIVACY_SECTIONS } from '../../legal/content'
import { LegalPublisherCard } from '../../legal/LegalPublisherCard'
import { DANIELCRAFT_PUBLISHER } from '../../legal/danielcraftPublisher'

export function PrivacyPage() {
  return (
    <Box>
      <MarketingHero
        compact
        title="Politique de confidentialité"
        subtitle="Protection des données personnelles — RGPD."
        secondaryCta={null}
      />
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          Document d’information. Pour toute question : {LEGAL_CONTROLLER.contact}. Dernière mise à jour :{' '}
          {DANIELCRAFT_PUBLISHER.facturioLegalUpdated}.
        </Alert>
        <LegalPublisherCard />
        <LegalSections sections={PRIVACY_SECTIONS} />
        <Box sx={{ mt: 4, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Sécurité des secrets
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Les clés Stripe prestataire sont chiffrées en base de données lorsque le
            serveur est configuré avec SECRETS_ENCRYPTION_KEY. Les paiements de vos clients ne transitent pas par le
            compte Stripe Facturio (abonnement).
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}
