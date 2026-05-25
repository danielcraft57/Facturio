import { ReactNode } from 'react'
import { Box, Container, Paper, Step, StepLabel, Stepper, Typography, alpha } from '@mui/material'
import CodeIcon from '@mui/icons-material/Code'

type Props = {
  activeStep: number
  steps: readonly string[]
  title: string
  subtitle?: string
  children: ReactNode
}

export function OnboardingLayout({ activeStep, steps, title, subtitle, children }: Props) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: { xs: 4, sm: 6 },
        background: (t) =>
          `linear-gradient(160deg, ${alpha(t.palette.primary.main, 0.08)} 0%, ${t.palette.background.default} 45%, ${alpha(t.palette.primary.light, 0.06)} 100%)`,
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
            }}
          >
            <CodeIcon />
          </Box>
          <Box>
            <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
              Espace développeur
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configuration initiale · 2 min
            </Typography>
          </Box>
        </Box>

        <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: subtitle ? 1 : 3 }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {subtitle}
            </Typography>
          ) : null}

          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4, display: { xs: 'none', sm: 'flex' } }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: { xs: 'block', sm: 'none' }, mb: 2 }}
          >
            Étape {activeStep + 1} / {steps.length} — {steps[activeStep]}
          </Typography>

          {children}
        </Paper>
      </Container>
    </Box>
  )
}
