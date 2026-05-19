import { Typography, Box } from '@mui/material'
import { InvoiceStripeSection } from '../InvoiceStripeSection'
import { useOrganizationProfile } from '../OrganizationProfileContext'
import { SettingsPageSkeleton } from '../components/SettingsPageSkeleton'

export function SettingsPaymentsPage() {
  const { profile, setProfile, loading } = useOrganizationProfile()

  if (loading) {
    return <SettingsPageSkeleton blocks={1} />
  }

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
        Paiements en ligne
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Connectez votre compte Stripe prestataire pour encaisser vos factures.
      </Typography>
      <InvoiceStripeSection profile={profile} onUpdated={setProfile} />
    </Box>
  )
}
