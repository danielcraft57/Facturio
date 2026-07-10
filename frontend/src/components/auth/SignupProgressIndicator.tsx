import { Box, LinearProgress, Step, StepLabel, Stepper, Typography } from '@mui/material'
import {
  isSignupPasswordConfirmed,
  isSignupPasswordValid,
} from '../../utils/signupPasswordRules'

const STEPS = ['Vos infos', 'Mot de passe', 'Validation'] as const

type Props = {
  email: string
  organizationName: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
  acceptPrivacy: boolean
}

/**
 * Indicateur de progression du formulaire d'inscription (3 étapes).
 */
export function SignupProgressIndicator({
  email,
  organizationName,
  password,
  confirmPassword,
  acceptTerms,
  acceptPrivacy,
}: Props) {
  const step1Done = email.trim().length > 0 && organizationName.trim().length > 0
  const step2Done =
    isSignupPasswordValid(password) && isSignupPasswordConfirmed(password, confirmPassword)
  const step3Done = acceptTerms && acceptPrivacy

  const activeStep = !step1Done ? 0 : !step2Done ? 1 : !step3Done ? 2 : 3
  const progressPct = Math.round(((activeStep + (activeStep >= 3 ? 0 : 0.35)) / STEPS.length) * 100)

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          Progression
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Étape {Math.min(activeStep + 1, STEPS.length)} / {STEPS.length}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={activeStep >= 3 ? 100 : progressPct}
        sx={{ height: 6, borderRadius: 3, mb: 2 }}
      />
      <Stepper activeStep={Math.min(activeStep, STEPS.length - 1)} alternativeLabel sx={{ pt: 0 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  )
}
