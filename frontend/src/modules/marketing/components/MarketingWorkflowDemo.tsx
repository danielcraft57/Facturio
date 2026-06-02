import { useEffect, useMemo, useState } from 'react'
import { Box, Chip, LinearProgress, Stack, Typography, alpha } from '@mui/material'
import { keyframes } from '@mui/system'

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`

export type WorkflowStep = {
  src: string
  alt: string
  label: string
  caption?: string
}

type MarketingWorkflowDemoProps = {
  title: string
  subtitle?: string
  steps: WorkflowStep[]
  /** Durée d'affichage par étape (ms) */
  stepDurationMs?: number
  frameHeight?: number | { xs?: number; md?: number }
}

/**
 * Démo animée pas-à-pas (images Playwright) — création / envoi devis ou facture.
 */
export function MarketingWorkflowDemo({
  title,
  subtitle,
  steps,
  stepDurationMs = 2800,
  frameHeight = { xs: 220, md: 320 },
}: MarketingWorkflowDemoProps) {
  const [index, setIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  const safeSteps = useMemo(() => steps.filter((s) => s.src), [steps])
  const current = safeSteps[index] ?? safeSteps[0]

  useEffect(() => {
    if (safeSteps.length <= 1) return
    setProgress(0)
    const tick = 50
    let elapsed = 0
    const id = window.setInterval(() => {
      elapsed += tick
      setProgress(Math.min(100, (elapsed / stepDurationMs) * 100))
      if (elapsed >= stepDurationMs) {
        elapsed = 0
        setProgress(0)
        setIndex((i) => (i + 1) % safeSteps.length)
      }
    }, tick)
    return () => window.clearInterval(id)
  }, [index, safeSteps.length, stepDurationMs])

  if (!current) return null

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 560 }}>
          {subtitle}
        </Typography>
      )}

      <Box
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          border: 1,
          borderColor: 'divider',
          boxShadow: '0 20px 48px rgba(13, 27, 42, 0.12)',
          bgcolor: 'background.paper',
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
          }}
        >
          <Chip label={current.label} size="small" color="primary" variant="outlined" />
          <Typography variant="caption" color="text.secondary">
            {index + 1} / {safeSteps.length}
          </Typography>
        </Box>

        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ height: 3, borderRadius: 0 }}
        />

        <Box
          key={current.src}
          sx={{
            height: frameHeight,
            overflow: 'hidden',
            bgcolor: (t) => alpha(t.palette.grey[500], 0.06),
            animation: `${fadeIn} 0.45s ease-out`,
          }}
        >
          <Box
            component="img"
            src={current.src}
            alt={current.alt}
            loading="lazy"
            sx={{
              display: 'block',
              width: '100%',
              height: 'auto',
              objectFit: 'cover',
              objectPosition: 'top center',
            }}
          />
        </Box>

        {current.caption && (
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              {current.caption}
            </Typography>
          </Box>
        )}
      </Box>

      <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 1.5 }}>
        {safeSteps.map((step, i) => (
          <Box
            key={step.src}
            onClick={() => {
              setIndex(i)
              setProgress(0)
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setIndex(i)
                setProgress(0)
              }
            }}
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              cursor: 'pointer',
              bgcolor: i === index ? 'primary.main' : 'action.disabled',
              transition: 'transform 150ms',
              transform: i === index ? 'scale(1.2)' : 'scale(1)',
            }}
            aria-label={step.label}
          />
        ))}
      </Stack>
    </Box>
  )
}
