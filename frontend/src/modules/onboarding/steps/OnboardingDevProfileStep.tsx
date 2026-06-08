import { alpha, Box, Button, Chip, Stack, Typography } from '@mui/material'
import CodeOutlinedIcon from '@mui/icons-material/CodeOutlined'
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined'
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined'
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined'
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined'
import {
  ONBOARDING_PROFILE_GROUPS,
  ONBOARDING_PROFILES,
  type OnboardingProfileDef,
} from '../onboardingProfiles'

const GROUP_ICONS: Record<string, typeof CodeOutlinedIcon> = {
  dev: CodeOutlinedIcon,
  design: PaletteOutlinedIcon,
  commercial: CampaignOutlinedIcon,
  communication: ForumOutlinedIcon,
  consulting: HandshakeOutlinedIcon,
}

type Props = {
  selected: string | null
  onSelect: (id: string) => void
  onNext: () => void
  onBack: () => void
}

function ProfileChip({
  profile,
  selected,
  onSelect,
}: {
  profile: OnboardingProfileDef
  selected: boolean
  onSelect: (id: string) => void
}) {
  return (
    <Chip
      label={
        <Box>
          <Typography component="span" variant="body2" fontWeight={selected ? 700 : 600}>
            {profile.label}
          </Typography>
          <Typography
            component="div"
            variant="caption"
            color="text.secondary"
            sx={{ lineHeight: 1.3, mt: 0.25, maxWidth: 220 }}
          >
            {profile.description}
          </Typography>
        </Box>
      }
      clickable
      color={selected ? 'primary' : 'default'}
      variant={selected ? 'filled' : 'outlined'}
      onClick={() => onSelect(profile.id)}
      sx={{
        height: 'auto',
        py: 1.25,
        px: 0.75,
        alignItems: 'flex-start',
        '& .MuiChip-label': { display: 'block', whiteSpace: 'normal', textAlign: 'left' },
        ...(selected
          ? {}
          : {
              borderColor: 'divider',
              '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.06) },
            }),
      }}
    />
  )
}

export function OnboardingDevProfileStep({ selected, onSelect, onNext, onBack }: Props) {
  return (
    <Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Votre métier oriente le catalogue et les technos proposées à l’étape suivante (développement, design,
        commercial, communication…).
      </Typography>

      <Stack spacing={2.5} sx={{ mb: 3 }}>
        {ONBOARDING_PROFILE_GROUPS.map((group) => {
          const profiles = ONBOARDING_PROFILES.filter((p) => p.groupId === group.id)
          if (!profiles.length) return null
          const GroupIcon = GROUP_ICONS[group.id] ?? CodeOutlinedIcon
          return (
            <Box key={group.id}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <GroupIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" fontWeight={700}>
                  {group.label}
                </Typography>
              </Stack>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {profiles.map((profile) => (
                  <ProfileChip
                    key={profile.id}
                    profile={profile}
                    selected={selected === profile.id}
                    onSelect={onSelect}
                  />
                ))}
              </Box>
            </Box>
          )
        })}
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Button variant="outlined" onClick={onBack} sx={{ flex: 1 }}>
          Retour
        </Button>
        <Button variant="contained" size="large" onClick={onNext} sx={{ flex: 2 }} disabled={!selected}>
          Choisir ma stack
        </Button>
      </Stack>
    </Box>
  )
}
