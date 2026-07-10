import { ReactNode } from 'react'
import { Box, Container, Paper, Step, StepLabel, Stepper, Typography, alpha } from '@mui/material'
import CodeIcon from '@mui/icons-material/Code'
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined'
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined'
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined'
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined'
import {
  ONBOARDING_PROFILE_GROUPS,
  resolveOnboardingProfile,
} from './onboardingProfiles'

type Props = {
  activeStep: number
  steps: readonly string[]
  title: string
  subtitle?: string
  profileId?: string | null
  children: ReactNode
}

const GROUP_ICONS = {
  dev: CodeIcon,
  design: PaletteOutlinedIcon,
  commercial: CampaignOutlinedIcon,
  communication: ForumOutlinedIcon,
  consulting: HandshakeOutlinedIcon,
} as const

/**
 * En-tête adaptatif selon le profil onboarding sélectionné.
 *
 * @param profileId - Identifiant profil (étape 1+)
 */
function resolveLayoutMeta(profileId?: string | null): { overline: string; hint: string; Icon: typeof CodeIcon } {
  const profile = profileId ? resolveOnboardingProfile(profileId) : null
  const group = profile
    ? ONBOARDING_PROFILE_GROUPS.find((g) => g.id === profile.groupId)
    : null
  const Icon = profile ? (GROUP_ICONS[profile.groupId as keyof typeof GROUP_ICONS] ?? CodeIcon) : CodeIcon
  if (!profile || !group) {
    return {
      overline: 'Configuration initiale',
      hint: 'Assistant catalogue · 2 min',
      Icon,
    }
  }
  return {
    overline: group.label,
    hint: `${profile.label} · catalogue sur mesure`,
    Icon,
  }
}

/**
 * Layout assistant d'installation (onboarding catalogue).
 */
export function OnboardingLayout({ activeStep, steps, title, subtitle, profileId, children }: Props) {
  const meta = resolveLayoutMeta(profileId)

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
            <meta.Icon />
          </Box>
          <Box>
            <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
              {meta.overline}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {meta.hint}
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
