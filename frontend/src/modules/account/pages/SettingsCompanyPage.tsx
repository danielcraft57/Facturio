import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  InputAdornment,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import BusinessIcon from '@mui/icons-material/Business'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import ContactMailIcon from '@mui/icons-material/ContactMail'
import { useOrganizationProfile } from '../OrganizationProfileContext'
import { SettingsPageSkeleton } from '../components/SettingsPageSkeleton'

export function SettingsCompanyPage() {
  const { form, loading, saving, error, setError, success, setSuccess, handleChange, save } =
    useOrganizationProfile()

  if (loading) {
    return <SettingsPageSkeleton blocks={3} />
  }

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
        Entreprise
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Informations affichées sur vos devis et factures (mentions légales, SIRET, adresse).
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(false)} sx={{ mb: 2 }}>
          Profil enregistré.
        </Alert>
      )}

      <Box component="form" onSubmit={(e) => { e.preventDefault(); void save() }}>
        <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessIcon fontSize="small" /> Identité et légal
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth label="Nom affiché" value={form.name ?? ''} onChange={handleChange('name')} required />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth label="Raison sociale" value={form.legalName ?? ''} onChange={handleChange('legalName')} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="SIRET" value={form.siret ?? ''} onChange={handleChange('siret')} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="SIREN" value={form.siren ?? ''} onChange={handleChange('siren')} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="N° TVA" value={form.vatNumber ?? ''} onChange={handleChange('vatNumber')} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="RCS" value={form.rcs ?? ''} onChange={handleChange('rcs')} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="Ville RCS" value={form.rcsCity ?? ''} onChange={handleChange('rcsCity')} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="Forme juridique" value={form.legalForm ?? ''} onChange={handleChange('legalForm')} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOnIcon fontSize="small" /> Adresse
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Adresse" value={form.address ?? ''} onChange={handleChange('address')} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Complément" value={form.address2 ?? ''} onChange={handleChange('address2')} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth label="Code postal" value={form.zipCode ?? ''} onChange={handleChange('zipCode')} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth label="Ville" value={form.city ?? ''} onChange={handleChange('city')} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth label="Pays" value={form.country ?? 'FR'} onChange={handleChange('country')} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <ContactMailIcon fontSize="small" /> Contact
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="email"
                  label="Email"
                  value={form.email ?? ''}
                  onChange={handleChange('email')}
                  InputProps={{ startAdornment: <InputAdornment position="start">@</InputAdornment> }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth label="Téléphone" value={form.phone ?? ''} onChange={handleChange('phone')} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Site web" value={form.website ?? ''} onChange={handleChange('website')} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="submit" variant="contained" disabled={saving} startIcon={<SaveIcon />}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
