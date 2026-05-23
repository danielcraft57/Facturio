import { useMemo } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Typography,
  Stack,
  IconButton,
  Divider,
  Chip,
  InputAdornment,
  alpha,
  useTheme,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import BusinessIcon from '@mui/icons-material/Business'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import BadgeIcon from '@mui/icons-material/Badge'
import PlaceIcon from '@mui/icons-material/Place'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import EditIcon from '@mui/icons-material/Edit'
import type { Client } from '../../../services/clients'
import { financePrimaryButtonSx, financeOutlinedButtonSx } from '../../../components/finance/financeStyles'
import {
  formatSiren,
  getSirenValidation,
  isValidSiren,
  parseSirenInput,
} from '../../../utils/french-siret'
import {
  formatPhoneDisplay,
  getPhoneValidation,
  isPhoneValid,
  parsePhoneInput,
} from '../../../utils/french-phone'

export type ClientFormValues = {
  name: string
  email: string
  phone: string
  siren: string
  address: string
  status: Client['status']
}

type Props = {
  open: boolean
  mode: 'create' | 'edit'
  values: ClientFormValues
  error: string | null
  saving: boolean
  onClose: () => void
  onChange: (values: ClientFormValues) => void
  onSubmit: () => void
  onClearError: () => void
}

const STATUS_OPTIONS: {
  value: Client['status']
  label: string
  color: 'success' | 'default' | 'warning'
}[] = [
  { value: 'active', label: 'Actif', color: 'success' },
  { value: 'prospect', label: 'Prospect', color: 'warning' },
  { value: 'inactive', label: 'Inactif', color: 'default' },
]

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    bgcolor: (t: { palette: { mode: string } }) =>
      t.palette.mode === 'dark' ? alpha('#fff', 0.04) : alpha('#0f172a', 0.02),
  },
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="overline"
      sx={{
        display: 'block',
        fontWeight: 800,
        letterSpacing: '0.08em',
        color: 'text.secondary',
        mb: 1,
      }}
    >
      {children}
    </Typography>
  )
}

export function validateClientFormValues(values: ClientFormValues): string | null {
  const name = values.name.trim()
  const email = values.email.trim()
  if (!name) return 'Le nom du client est obligatoire'
  if (!email) return "L'email est obligatoire"
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email invalide'
  if (!isPhoneValid(values.phone)) return 'Numéro de téléphone invalide'
  const sirenDigits = parseSirenInput(values.siren)
  if (sirenDigits.length > 0 && sirenDigits.length !== 9) {
    return 'Le SIREN doit contenir exactement 9 chiffres'
  }
  if (sirenDigits.length === 9 && !isValidSiren(sirenDigits)) {
    return 'SIREN invalide (vérifiez la clé de contrôle)'
  }
  return null
}

export function ClientFormDialog({
  open,
  mode,
  values,
  error,
  saving,
  onClose,
  onChange,
  onSubmit,
  onClearError,
}: Props) {
  const theme = useTheme()
  const phoneValidation = useMemo(() => getPhoneValidation(values.phone), [values.phone])
  const sirenValidation = useMemo(
    () => getSirenValidation(parseSirenInput(values.siren)),
    [values.siren],
  )

  const phoneError =
    phoneValidation.state === 'invalid' || phoneValidation.state === 'incomplete'
  const sirenError =
    sirenValidation.state === 'invalid' ||
    (sirenValidation.state === 'incomplete' && parseSirenInput(values.siren).length > 0)

  return (
    <Dialog
      open={open}
      onClose={() => !saving && onClose()}
      maxWidth="sm"
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: `1px solid ${alpha('#0f172a', theme.palette.mode === 'dark' ? 0.2 : 0.08)}`,
          boxShadow: `0 24px 48px ${alpha('#0f172a', 0.18)}`,
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 2.5,
          py: 2,
          bgcolor: alpha('#0f172a', theme.palette.mode === 'dark' ? 0.35 : 0.04),
          borderBottom: `1px solid ${alpha('#0f172a', 0.08)}`,
        }}
      >
        <Stack direction="row" alignItems="flex-start" spacing={1.5}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#0f172a',
              color: '#fff',
              flexShrink: 0,
            }}
          >
            {mode === 'create' ? <PersonAddIcon /> : <EditIcon />}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" fontWeight={800} letterSpacing="-0.02em">
              {mode === 'create' ? 'Nouveau client' : 'Modifier le client'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {mode === 'create'
                ? 'Fiche contact pour factures, devis et facturation électronique.'
                : 'Mettez à jour les informations de contact et de facturation.'}
            </Typography>
          </Box>
          <IconButton
            aria-label="Fermer"
            onClick={onClose}
            disabled={saving}
            size="small"
            sx={{ mt: -0.5 }}
          >
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: 2.5, py: 2.5 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={onClearError}>
            {error}
          </Alert>
        )}

        <Stack spacing={2.5}>
          <Box>
            <SectionTitle>Identité</SectionTitle>
            <TextField
              fullWidth
              required
              label="Raison sociale ou nom"
              placeholder="Ex. Dupont SAS"
              value={values.name}
              onChange={(e) => onChange({ ...values, name: e.target.value })}
              sx={fieldSx}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          <Box>
            <SectionTitle>Contact</SectionTitle>
            <Stack spacing={2}>
              <TextField
                fullWidth
                required
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="contact@entreprise.fr"
                value={values.email}
                onChange={(e) => onChange({ ...values, email: e.target.value })}
                sx={fieldSx}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                fullWidth
                label="Téléphone"
                placeholder="06 12 34 56 78"
                value={formatPhoneDisplay(values.phone)}
                error={phoneError}
                onChange={(e) =>
                  onChange({ ...values, phone: parsePhoneInput(e.target.value) })
                }
                helperText={phoneValidation.message}
                sx={fieldSx}
                slotProps={{
                  input: {
                    inputMode: 'tel',
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Stack>
          </Box>

          <Box>
            <SectionTitle>Facturation B2B</SectionTitle>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="SIREN"
                placeholder="443 061 841"
                value={formatSiren(parseSirenInput(values.siren))}
                error={sirenError}
                onChange={(e) =>
                  onChange({ ...values, siren: parseSirenInput(e.target.value) })
                }
                helperText={
                  sirenValidation.message ||
                  'Optionnel — 9 chiffres pour la facturation électronique (réforme 2026)'
                }
                sx={fieldSx}
                slotProps={{
                  input: {
                    inputMode: 'numeric',
                    startAdornment: (
                      <InputAdornment position="start">
                        <BadgeIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                fullWidth
                label="Adresse postale"
                placeholder="12 rue de la Paix, 75002 Paris"
                multiline
                minRows={2}
                maxRows={4}
                value={values.address}
                onChange={(e) => onChange({ ...values, address: e.target.value })}
                sx={fieldSx}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                        <PlaceIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Stack>
          </Box>

          <Box>
            <SectionTitle>Statut dans le carnet</SectionTitle>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {STATUS_OPTIONS.map((opt) => {
                const selected = values.status === opt.value
                return (
                  <Chip
                    key={opt.value}
                    label={opt.label}
                    color={selected ? opt.color : 'default'}
                    variant={selected ? 'filled' : 'outlined'}
                    onClick={() => !saving && onChange({ ...values, status: opt.value })}
                    sx={{
                      fontWeight: 700,
                      borderRadius: 2,
                      ...(selected
                        ? {}
                        : {
                            borderColor: alpha('#0f172a', 0.2),
                          }),
                    }}
                  />
                )
              })}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions
        sx={{
          px: 2.5,
          py: 2,
          gap: 1,
          bgcolor: alpha('#0f172a', theme.palette.mode === 'dark' ? 0.12 : 0.02),
        }}
      >
        <Button onClick={onClose} disabled={saving} sx={financeOutlinedButtonSx}>
          Annuler
        </Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={saving}
          sx={financePrimaryButtonSx}
          startIcon={
            saving ? <CircularProgress size={18} color="inherit" /> : undefined
          }
        >
          {saving
            ? 'Enregistrement…'
            : mode === 'create'
              ? 'Créer le client'
              : 'Enregistrer'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export function clientToFormValues(client: Client): ClientFormValues {
  return {
    name: client.name,
    email: client.email,
    phone: client.phone || '',
    siren: client.siren || '',
    address: client.address?.street || '',
    status: client.status,
  }
}

export const emptyClientFormValues: ClientFormValues = {
  name: '',
  email: '',
  phone: '',
  siren: '',
  address: '',
  status: 'prospect',
}
