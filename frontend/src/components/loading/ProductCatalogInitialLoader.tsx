import { useEffect, useMemo, useState } from 'react'
import { Box, Grid, LinearProgress, Skeleton, Typography, alpha, useTheme } from '@mui/material'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'

const STEPS = [
  'Chargement du catalogue…',
  'Organisation des prestations…',
  'Préparation de l’affichage…',
] as const

type Props = {
  /** Premier chargement après F5 (message plus explicite). */
  initial?: boolean
}

/** Attente chargement catalogue — même esprit que AuthBootPage. */
export function ProductCatalogInitialLoader({ initial = false }: Props) {
  const theme = useTheme()
  const [stepIndex, setStepIndex] = useState(0)
  const [progress, setProgress] = useState(8)

  const stepLabel = useMemo(
    () => STEPS[Math.min(stepIndex, STEPS.length - 1)],
    [stepIndex],
  )

  useEffect(() => {
    const stepTimer = window.setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
      setProgress((p) => Math.min(p + 18, 92))
    }, 420)
    return () => window.clearInterval(stepTimer)
  }, [])

  return (
    <Box sx={{ py: initial ? 1 : 2 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: { xs: 3, sm: 4 },
          gap: 2,
          mb: 3,
          borderRadius: 3,
          bgcolor: (t) => alpha(t.palette.primary.main, 0.03),
          border: '1px solid',
          borderColor: (t) => alpha(t.palette.primary.main, 0.08),
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
          <Inventory2OutlinedIcon />
        </Box>

        <Box sx={{ width: '100%', maxWidth: 360, textAlign: 'center', px: 2 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {initial ? 'Ouverture du catalogue' : 'Actualisation du catalogue'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, minHeight: 40 }}>
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

      <Grid container spacing={2}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <Skeleton variant="rounded" height={320} animation="wave" />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
