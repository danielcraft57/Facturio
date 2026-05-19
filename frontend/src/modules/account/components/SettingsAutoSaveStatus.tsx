import { Box, Chip, CircularProgress, Typography } from '@mui/material'
import CloudDoneIcon from '@mui/icons-material/CloudDone'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import type { AutoSaveStatus } from '../OrganizationProfileContext'

type Props = {
  status: AutoSaveStatus
  error?: string | null
  blockedMessage?: string | null
}

export function SettingsAutoSaveStatus({ status, error, blockedMessage }: Props) {
  if (status === 'idle' && !blockedMessage && !error) return null

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 2 }}>
      {status === 'pending' && (
        <Chip
          size="small"
          icon={<CircularProgress size={14} color="inherit" />}
          label="Modifications en attente…"
          variant="outlined"
        />
      )}
      {status === 'saving' && (
        <Chip
          size="small"
          icon={<CircularProgress size={14} color="inherit" />}
          label="Enregistrement…"
          color="primary"
          variant="outlined"
        />
      )}
      {status === 'saved' && (
        <Chip
          size="small"
          icon={<CloudDoneIcon />}
          label="Enregistré"
          color="success"
          variant="outlined"
        />
      )}
      {status === 'error' && (
        <Chip
          size="small"
          icon={<ErrorOutlineIcon />}
          label="Erreur d’enregistrement"
          color="error"
          variant="outlined"
        />
      )}
      {blockedMessage && status !== 'saving' && (
        <Typography variant="caption" color="text.secondary">
          {blockedMessage}
        </Typography>
      )}
      {error && (
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      )}
    </Box>
  )
}
