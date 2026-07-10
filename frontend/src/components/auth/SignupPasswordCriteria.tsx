import { Box, Typography } from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import {
  evaluateSignupPasswordRules,
  isSignupPasswordConfirmed,
} from '../../utils/signupPasswordRules'

type Props = {
  password: string
  confirmPassword: string
}

/**
 * Liste des critères mot de passe visible avant la soumission du formulaire d'inscription.
 */
export function SignupPasswordCriteria({ password, confirmPassword }: Props) {
  const rules = evaluateSignupPasswordRules(password)
  const showConfirm = confirmPassword.length > 0
  const confirmed = isSignupPasswordConfirmed(password, confirmPassword)

  return (
    <Box
      component="ul"
      sx={{
        m: 0,
        mt: 1,
        mb: 0.5,
        p: 0,
        listStyle: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
      }}
      aria-live="polite"
    >
      {rules.map((rule) => (
        <Box component="li" key={rule.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          {rule.met ? (
            <CheckCircleOutlineIcon sx={{ fontSize: 16, color: 'success.main' }} />
          ) : (
            <RadioButtonUncheckedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
          )}
          <Typography variant="caption" color={rule.met ? 'success.main' : 'text.secondary'}>
            {rule.label}
          </Typography>
        </Box>
      ))}
      {showConfirm ? (
        <Box component="li" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          {confirmed ? (
            <CheckCircleOutlineIcon sx={{ fontSize: 16, color: 'success.main' }} />
          ) : (
            <RadioButtonUncheckedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
          )}
          <Typography variant="caption" color={confirmed ? 'success.main' : 'text.secondary'}>
            Les mots de passe correspondent
          </Typography>
        </Box>
      ) : null}
    </Box>
  )
}
