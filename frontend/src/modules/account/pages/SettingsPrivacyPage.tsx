import { Typography, Box } from '@mui/material'
import { PrivacyClientSettingsSection } from '../PrivacyClientSettingsSection'
import { useOrganizationProfile } from '../OrganizationProfileContext'
import { SettingsPageSkeleton } from '../components/SettingsPageSkeleton'

export function SettingsPrivacyPage() {
  const { form, loading, setField } = useOrganizationProfile()

  if (loading) {
    return <SettingsPageSkeleton blocks={1} />
  }

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
        Confidentialité (pages clients)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Mentions affichées sur les pages publiques de devis et factures. Enregistrement automatique.
      </Typography>

      <PrivacyClientSettingsSection form={form} onFieldChange={setField} />
    </Box>
  )
}
