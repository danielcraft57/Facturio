import { Box, Stack, Typography, alpha } from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import HistoryIcon from '@mui/icons-material/History'
import {
  getActivationStepHistory,
  type AccountActivationStepId,
} from '../../utils/accountActivationStorage'
import { questHudSurfaceSx } from '../demo/demoTheme'

const STEP_LABELS: Record<AccountActivationStepId, string> = {
  'setup-company': 'Infos entreprise',
  'first-invoice': 'Première facture',
  'first-client': 'Premier client',
}

type Props = {
  userId: string | number
  compact?: boolean
}

/**
 * Historique des étapes d'activation validées (dates locales).
 */
export function ActivationProgressHistory({ userId, compact = false }: Props) {
  const history = getActivationStepHistory(userId)
  if (history.length === 0) return null

  const content = (
    <Stack spacing={0.75}>
      {history.map((entry) => {
        const label = STEP_LABELS[entry.step] ?? entry.step
        const when = new Date(entry.completedAt).toLocaleString('fr-FR', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
        return (
          <Stack key={entry.step} direction="row" spacing={1} alignItems="center">
            <CheckCircleOutlineIcon sx={{ fontSize: 18, color: 'primary.main' }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap>
                {label}
              </Typography>
              {!compact && (
                <Typography variant="caption" color="text.secondary">
                  {when}
                </Typography>
              )}
            </Box>
          </Stack>
        )
      })}
    </Stack>
  )

  if (compact) {
    return (
      <Box sx={{ ...questHudSurfaceSx('light'), borderRadius: 2, px: 1.5, py: 1.25, mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
          <HistoryIcon sx={{ fontSize: 18, color: 'primary.main' }} />
          <Typography variant="subtitle2" fontWeight={700}>
            Parcours d&apos;activation terminé
          </Typography>
        </Stack>
        {content}
      </Box>
    )
  }

  return (
    <Box sx={{ pt: 0.5 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 0.6, mb: 0.75, display: 'block' }}>
        Historique
      </Typography>
      {content}
    </Box>
  )
}
