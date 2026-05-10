import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  InputAdornment
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import BusinessIcon from '@mui/icons-material/Business'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import ContactMailIcon from '@mui/icons-material/ContactMail'
import { organizationService, type OrganizationProfile, type UpdateOrganizationProfile } from '../../services/organizationService'

/**
 * Page Paramètres / Compte : informations de l'entreprise affichées sur les devis et factures.
 */
export function AccountPage() {
  const [profile, setProfile] = useState<OrganizationProfile | null>(null)
  const [form, setForm] = useState<UpdateOrganizationProfile>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let cancelled = false
    organizationService
      .getProfile()
      .then((res) => {
        if (cancelled) return
        const data = (res as any).data?.data ?? (res as any).data
        if (data) {
          setProfile(data)
          setForm({
            name: data.name ?? '',
            legalName: data.legalName ?? '',
            siret: data.siret ?? '',
            siren: data.siren ?? '',
            rcs: data.rcs ?? '',
            rcsCity: data.rcsCity ?? '',
            vatNumber: data.vatNumber ?? '',
            address: data.address ?? '',
            address2: data.address2 ?? '',
            city: data.city ?? '',
            zipCode: data.zipCode ?? '',
            country: data.country ?? 'FR',
            countryCode: data.countryCode ?? 'FR',
            email: data.email ?? '',
            phone: data.phone ?? '',
            website: data.website ?? '',
            capital: data.capital ?? '',
            legalForm: data.legalForm ?? '',
            apeCode: data.apeCode ?? '',
            apeLabel: data.apeLabel ?? '',
            legalRepresentative: data.legalRepresentative ?? '',
            legalRepresentativeRole: data.legalRepresentativeRole ?? '',
          })
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message ?? 'Impossible de charger le profil')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const handleChange = (field: keyof UpdateOrganizationProfile) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setError(null)
    setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const payload: UpdateOrganizationProfile = {}
      Object.keys(form).forEach((k) => {
        const key = k as keyof UpdateOrganizationProfile
        const v = form[key]
        if (v !== undefined && v !== '') (payload as any)[key] = v
        else if (v === '') (payload as any)[key] = null
      })
      await organizationService.updateProfile(payload)
      setSuccess(true)
      setProfile((prev) => (prev ? { ...prev, ...payload } : null))
    } catch (err: any) {
      setError(err?.message ?? 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
        Paramètres / Compte
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Ces informations sont utilisées sur vos devis et factures (en-tête, mentions légales). Renseignez au minimum le nom, l&apos;adresse et le SIRET pour être en règle.
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

      <form onSubmit={handleSubmit}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessIcon /> Identité et légal
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Nom affiché"
                  value={form.name ?? ''}
                  onChange={handleChange('name')}
                  required
                  helperText="Nom de l'entreprise sur les documents"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Raison sociale"
                  value={form.legalName ?? ''}
                  onChange={handleChange('legalName')}
                />
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
                <TextField fullWidth label="Forme juridique" value={form.legalForm ?? ''} onChange={handleChange('legalForm')} placeholder="ex. SARL, SAS" />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="Capital" value={form.capital ?? ''} onChange={handleChange('capital')} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="Code APE" value={form.apeCode ?? ''} onChange={handleChange('apeCode')} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="Représentant légal" value={form.legalRepresentative ?? ''} onChange={handleChange('legalRepresentative')} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="Fonction" value={form.legalRepresentativeRole ?? ''} onChange={handleChange('legalRepresentativeRole')} placeholder="ex. Gérant" />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOnIcon /> Adresse
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Adresse"
                  value={form.address ?? ''}
                  onChange={handleChange('address')}
                  placeholder="Numéro et voie"
                />
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

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <ContactMailIcon /> Contact
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
                <TextField fullWidth label="Site web" value={form.website ?? ''} onChange={handleChange('website')} placeholder="https://..." />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            type="submit"
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={saving}
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </Box>
      </form>
    </Box>
  )
}
