import { useEffect, useMemo, useRef } from 'react'
import {
  Alert,
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  InputAdornment,
  FormHelperText,
  CircularProgress,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import BadgeIcon from '@mui/icons-material/Badge'
import {
  formatSiren,
  formatSiret,
  getSirenValidation,
  getSiretValidation,
  parseSirenInput,
  parseSiretInput,
  sirenFromSiret,
  isValidSiret,
} from '../../../utils/french-siret'
import { useDebouncedEffect } from '../../../hooks/useDebouncedEffect'
import { useOrganizationProfile } from '../OrganizationProfileContext'

type Props = {
  siret: string
  siren: string
  rcs: string
  rcsCity: string
  apeCode: string
  apeLabel: string
  onSiretChange: (digits: string) => void
  onSirenChange: (digits: string) => void
  onRcsChange: (value: string) => void
  onRcsCityChange: (value: string) => void
  onApeCodeChange: (value: string) => void
  onApeLabelChange: (value: string) => void
}

function fieldColor(state: ReturnType<typeof getSirenValidation>['state']) {
  if (state === 'valid') return 'success'
  if (state === 'invalid') return 'error'
  return undefined
}

function EndAdornment({ state }: { state: ReturnType<typeof getSirenValidation>['state'] }) {
  if (state === 'valid') {
    return (
      <InputAdornment position="end">
        <CheckCircleOutlineIcon color="success" fontSize="small" />
      </InputAdornment>
    )
  }
  if (state === 'invalid') {
    return (
      <InputAdornment position="end">
        <ErrorOutlineIcon color="error" fontSize="small" />
      </InputAdornment>
    )
  }
  return null
}

export function OrganizationLegalIdsFields({
  siret,
  siren,
  rcs,
  rcsCity,
  apeCode,
  apeLabel,
  onSiretChange,
  onSirenChange,
  onRcsChange,
  onRcsCityChange,
  onApeCodeChange,
  onApeLabelChange,
}: Props) {
  const {
    lookupFromRegistry,
    registryLookupLoading,
    registryLookupMessage,
    loaded,
  } = useOrganizationProfile()

  const siretVal = useMemo(() => getSiretValidation(siret, siren), [siret, siren])
  const sirenVal = useMemo(() => getSirenValidation(siren), [siren])
  const userEditedSiretRef = useRef(false)

  const handleSiretChange = (raw: string) => {
    userEditedSiretRef.current = true
    const digits = parseSiretInput(raw)
    onSiretChange(digits)
    const extracted = sirenFromSiret(digits)
    if (extracted) onSirenChange(extracted)
  }

  useDebouncedEffect(
    () => {
      if (!loaded || !userEditedSiretRef.current) return
      if (!isValidSiret(siret)) return
      void lookupFromRegistry(siret)
    },
    [siret, loaded, lookupFromRegistry],
    800,
  )

  useEffect(() => {
    if (!loaded) return
    if (isValidSiret(siret)) {
      void lookupFromRegistry(siret, { onlyEmpty: true })
    } else if (siren.length === 9) {
      void lookupFromRegistry(siren, { onlyEmpty: true })
    }
    // Complément initial une seule fois au chargement
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded])

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Saisissez votre <strong>SIRET</strong> (établissement) : les champs disponibles seront
        préremplis depuis le registre national (API Entreprises). Validation Luhn en direct.
      </Typography>

      {registryLookupMessage && (
        <Alert
          severity={registryLookupMessage.includes('partielles') ? 'warning' : 'info'}
          sx={{ mb: 2 }}
        >
          {registryLookupMessage}
        </Alert>
      )}

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="SIRET (établissement)"
            name="organization-siret"
            value={formatSiret(siret)}
            onChange={(e) => handleSiretChange(e.target.value)}
            placeholder="823 417 050 00023"
            inputMode="numeric"
            autoComplete="off"
            color={fieldColor(siretVal.state)}
            error={siretVal.state === 'invalid'}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <BadgeIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: registryLookupLoading ? (
                <InputAdornment position="end">
                  <CircularProgress size={18} />
                </InputAdornment>
              ) : (
                <EndAdornment state={siretVal.state} />
              ),
            }}
            helperText={siretVal.message}
            FormHelperTextProps={{
              sx: {
                color:
                  siretVal.state === 'valid'
                    ? 'success.main'
                    : siretVal.state === 'invalid'
                      ? 'error.main'
                      : 'text.secondary',
              },
            }}
          />
          {siret.length >= 9 && siren.length === 9 && siret.slice(0, 9) === siren && (
            <FormHelperText sx={{ mt: -1, ml: 1.75, color: 'text.secondary' }}>
              NIC établissement : {siret.slice(9)} · SIREN : {formatSiren(siren)}
            </FormHelperText>
          )}
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={registryLookupLoading ? <CircularProgress size={16} /> : <SearchIcon />}
              disabled={!isValidSiret(siret) && siren.length !== 9}
              onClick={() => void lookupFromRegistry(siret || siren)}
            >
              Importer depuis le registre
            </Button>
          </Box>
          <TextField
            fullWidth
            label="SIREN (entreprise)"
            name="organization-siren"
            value={formatSiren(siren)}
            onChange={(e) => onSirenChange(parseSirenInput(e.target.value))}
            placeholder="823 417 050"
            inputMode="numeric"
            autoComplete="off"
            color={fieldColor(sirenVal.state)}
            error={sirenVal.state === 'invalid'}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <BadgeIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: <EndAdornment state={sirenVal.state} />,
            }}
            helperText={sirenVal.message}
            FormHelperTextProps={{
              sx: {
                color:
                  sirenVal.state === 'valid'
                    ? 'success.main'
                    : sirenVal.state === 'invalid'
                      ? 'error.main'
                      : 'text.secondary',
              },
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Code APE / NAF"
            value={apeCode}
            onChange={(e) => onApeCodeChange(e.target.value.toUpperCase())}
            placeholder="62.01Z"
            inputProps={{ maxLength: 10 }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Libellé activité (optionnel)"
            value={apeLabel}
            onChange={(e) => onApeLabelChange(e.target.value)}
            placeholder="Programmation informatique"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="RCS"
            value={rcs}
            onChange={(e) => onRcsChange(e.target.value)}
            placeholder="Metz"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Ville du greffe (RCS)"
            value={rcsCity}
            onChange={(e) => onRcsCityChange(e.target.value)}
          />
        </Grid>
      </Grid>
    </Box>
  )
}
