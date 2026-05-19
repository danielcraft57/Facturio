import { Card, CardContent, Typography, TextField, Grid } from '@mui/material'
import type { UpdateOrganizationProfile } from '../../services/organizationService'

type Props = {
  form: UpdateOrganizationProfile
  onFieldChange: (field: keyof UpdateOrganizationProfile, value: string) => void
}

/** Paramètres RGPD affichés à vos clients (pages publiques facture). */
export function PrivacyClientSettingsSection({ form, onFieldChange }: Props) {
  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Confidentialité vis-à-vis de vos clients
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Ces informations apparaissent sur les pages publiques de facture. Vous restez responsable du traitement
          des données de vos clients.
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Email contact données (RGPD)"
              type="email"
              value={form.dataControllerEmail ?? ''}
              onChange={(e) => onFieldChange('dataControllerEmail', e.target.value)}
              placeholder="dpo@votre-entreprise.fr"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="URL politique de confidentialité"
              value={form.privacyPolicyUrl ?? ''}
              onChange={(e) => onFieldChange('privacyPolicyUrl', e.target.value)}
              placeholder="https://votre-site.fr/confidentialite"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}
