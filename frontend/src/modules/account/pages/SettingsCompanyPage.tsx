import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  InputAdornment,
  Divider,
  MenuItem,
  FormControlLabel,
  Switch,
} from '@mui/material'
import BusinessIcon from '@mui/icons-material/Business'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import ContactMailIcon from '@mui/icons-material/ContactMail'
import DrawIcon from '@mui/icons-material/Draw'
import GavelIcon from '@mui/icons-material/Gavel'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import { useOrganizationProfile } from '../OrganizationProfileContext'
import { SettingsPageSkeleton } from '../components/SettingsPageSkeleton'
import { OrganizationSignatureField } from '../components/OrganizationSignatureField'
import { OrganizationLegalIdsFields } from '../components/OrganizationLegalIdsFields'
import { LegalFormAutocomplete } from '../components/LegalFormAutocomplete'

export function SettingsCompanyPage() {
  const { form, loading, handleChange, setField } = useOrganizationProfile()

  if (loading) {
    return <SettingsPageSkeleton blocks={4} />
  }

  return (
    <Box sx={{ maxWidth: 720 }}>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
        Entreprise
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        Ces informations apparaissent sur vos devis, factures et mentions légales. Les modifications
        sont enregistrées automatiquement.
      </Typography>

      <Box>
        <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent sx={{ py: 2.5 }}>
            <Typography
              variant="subtitle1"
              fontWeight={600}
              sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <BusinessIcon fontSize="small" color="primary" />
              Identité
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Nom commercial"
                  value={form.name ?? ''}
                  onChange={handleChange('name')}
                  required
                  helperText="Enseigne ou marque (ex. DanielCraft) — visible par vos clients"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Dénomination"
                  value={form.legalName ?? ''}
                  onChange={handleChange('legalName')}
                  helperText="Dénomination légale au RNE (ex. Loïc Daniel pour un EI)"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <LegalFormAutocomplete
                  value={form.legalForm ?? ''}
                  onChange={(v) => setField('legalForm', v)}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent sx={{ py: 2.5 }}>
            <Typography
              variant="subtitle1"
              fontWeight={600}
              sx={{ mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <GavelIcon fontSize="small" color="primary" />
              Identifiants légaux
            </Typography>
            <OrganizationLegalIdsFields
              siret={form.siret ?? ''}
              siren={form.siren ?? ''}
              rcs={form.rcs ?? ''}
              rcsCity={form.rcsCity ?? ''}
              apeCode={form.apeCode ?? ''}
              apeLabel={form.apeLabel ?? ''}
              onSiretChange={(v) => setField('siret', v)}
              onSirenChange={(v) => setField('siren', v)}
              onRcsChange={(v) => setField('rcs', v)}
              onRcsCityChange={(v) => setField('rcsCity', v)}
              onApeCodeChange={(v) => setField('apeCode', v)}
              onApeLabelChange={(v) => setField('apeLabel', v)}
            />
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent sx={{ py: 2.5 }}>
            <Typography
              variant="subtitle1"
              fontWeight={600}
              sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <LocationOnIcon fontSize="small" color="primary" />
              Adresse
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Adresse"
                  value={form.address ?? ''}
                  onChange={handleChange('address')}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Complément d’adresse"
                  value={form.address2 ?? ''}
                  onChange={handleChange('address2')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Code postal"
                  value={form.zipCode ?? ''}
                  onChange={handleChange('zipCode')}
                  inputMode="numeric"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 5 }}>
                <TextField fullWidth label="Ville" value={form.city ?? ''} onChange={handleChange('city')} />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  fullWidth
                  label="Pays"
                  value={form.country ?? 'FR'}
                  onChange={handleChange('country')}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent sx={{ py: 2.5 }}>
            <Typography
              variant="subtitle1"
              fontWeight={600}
              sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <ContactMailIcon fontSize="small" color="primary" />
              Contact
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="email"
                  label="Email"
                  value={form.email ?? ''}
                  onChange={handleChange('email')}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">@</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Téléphone"
                  value={form.phone ?? ''}
                  onChange={handleChange('phone')}
                  inputMode="tel"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Site web"
                  value={form.website ?? ''}
                  onChange={handleChange('website')}
                  placeholder="https://"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent sx={{ py: 2.5 }}>
            <Typography
              variant="subtitle1"
              fontWeight={600}
              sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <AccountBalanceIcon fontSize="small" color="primary" />
              Fiscalité (IS / CFE)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Ces prefs alimentent le calcul auto des déclarations IS et CFE. Laisser vide la valeur
              locative pour un forfait basé sur le CA.
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Activité CFE"
                  value={form.cfeActivity || 'SERVICE'}
                  onChange={handleChange('cfeActivity')}
                >
                  <MenuItem value="SERVICE">Services</MenuItem>
                  <MenuItem value="COMMERCE">Commerce</MenuItem>
                  <MenuItem value="INDUSTRIE">Industrie</MenuItem>
                  <MenuItem value="ARTISANAT">Artisanat</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Taux communal CFE (%)"
                  type="number"
                  value={form.cfeCommunalRate ?? ''}
                  onChange={handleChange('cfeCommunalRate')}
                  helperText="Ex. 1.2 - défaut 1 % si vide"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Valeur locative CFE"
                  type="number"
                  value={form.cfePropertyValue ?? ''}
                  onChange={handleChange('cfePropertyValue')}
                  helperText="Optionnel - sinon forfait sur CA"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">€</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Capital détenu par personnes physiques"
                  type="number"
                  value={form.capitalHeldByIndividuals ?? 100}
                  onChange={handleChange('capitalHeldByIndividuals')}
                  helperText="Pour la réduction IS PME (seuil 75 %)"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.isPmeEligible !== false}
                      onChange={(e) => setField('isPmeEligible', e.target.checked)}
                    />
                  }
                  label="Éligible réduction IS PME"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent sx={{ py: 2.5 }}>
            <Typography
              variant="subtitle1"
              fontWeight={600}
              sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <DrawIcon fontSize="small" color="primary" />
              Signature des documents
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <OrganizationSignatureField
              value={form.signature ?? ''}
              onChange={(signature) => setField('signature', signature)}
            />
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}
