import { Typography, Box, Button, Alert, CircularProgress } from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import { PrivacyClientSettingsSection } from '../PrivacyClientSettingsSection'
import { useOrganizationProfile } from '../OrganizationProfileContext'
import { SettingsPageSkeleton } from '../components/SettingsPageSkeleton'

export function SettingsPrivacyPage() {
  const { form, loading, saving, error, setError, success, setSuccess, setField, save } =
    useOrganizationProfile()

  if (loading) {
    return <SettingsPageSkeleton blocks={1} />
  }

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
        Confidentialité (pages clients)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Mentions affichées sur les pages publiques de devis et factures envoyées à vos clients.
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(false)} sx={{ mb: 2 }}>
          Enregistré.
        </Alert>
      )}

      <PrivacyClientSettingsSection form={form} onFieldChange={setField} />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button variant="contained" disabled={saving} startIcon={<SaveIcon />} onClick={() => void save()}>
          Enregistrer
        </Button>
      </Box>
    </Box>
  )
}
