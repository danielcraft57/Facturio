import {
  Box,
  Dialog,
  LinearProgress,
  Typography,
  alpha,
  useTheme,
} from '@mui/material'
import { usePreparationProgress } from '../../hooks/usePreparationProgress'
import {
  getWorkspacePreparationConfig,
  type WorkspacePreparationResource,
} from './workspacePreparationConfig'

type WorkspacePreparationDialogProps = {
  open: boolean
  resource: WorkspacePreparationResource
  /** Rafraîchissement (pas le premier chargement F5). */
  refreshing?: boolean
}

/** Popin de préparation d’espace — même esprit que AuthBootPage après connexion. */
export function WorkspacePreparationDialog({
  open,
  resource,
  refreshing = false,
}: WorkspacePreparationDialogProps) {
  const theme = useTheme()
  const { title, steps, Icon } = getWorkspacePreparationConfig(resource)
  const { stepLabel, progress } = usePreparationProgress(steps, open)

  return (
    <Dialog
      open={open}
      fullWidth
      maxWidth="xs"
      disableEscapeKeyDown
      aria-labelledby="workspace-preparation-title"
      aria-describedby="workspace-preparation-step"
      PaperProps={{
        elevation: 8,
        sx: {
          borderRadius: 3,
          px: { xs: 2.5, sm: 3 },
          py: { xs: 3, sm: 3.5 },
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: (t) => alpha(t.palette.primary.main, 0.12),
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: (t) => alpha(t.palette.common.black, t.palette.mode === 'dark' ? 0.55 : 0.28),
            backdropFilter: 'blur(3px)',
          },
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 2.5,
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
            color: 'primary.main',
          }}
        >
          <Icon sx={{ fontSize: 28 }} />
        </Box>

        <Box sx={{ width: '100%', maxWidth: 360 }}>
          <Typography id="workspace-preparation-title" variant="h6" fontWeight={600} gutterBottom>
            {refreshing ? title.replace('Ouverture', 'Actualisation') : title}
          </Typography>
          <Typography
            id="workspace-preparation-step"
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2.5, minHeight: 40 }}
          >
            {stepLabel}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 4,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              '& .MuiLinearProgress-bar': {
                borderRadius: 2,
                transition: 'transform 0.35s ease',
              },
            }}
          />
        </Box>
      </Box>
    </Dialog>
  )
}
