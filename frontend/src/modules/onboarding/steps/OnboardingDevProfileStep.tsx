import { Box, Button, Chip, Stack, Typography } from '@mui/material'

const PROFILES = [
  { id: 'freelance', label: 'Freelance / solo' },
  { id: 'indie', label: 'Indie hacker' },
  { id: 'studio', label: 'Petite agence tech' },
  { id: 'student', label: 'Étudiant·e / alternance' },
  { id: 'other', label: 'Autre profil dev' },
] as const

type Props = {
  selected: string | null
  onSelect: (id: string) => void
  onNext: () => void
  onBack: () => void
}

export function OnboardingDevProfileStep({ selected, onSelect, onNext, onBack }: Props) {
  return (
    <Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        On adapte le ton du catalogue à votre réalité. Aucune donnée sensible — juste pour vous guider.
      </Typography>

      <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 3 }}>
        {PROFILES.map((p) => (
          <Chip
            key={p.id}
            label={p.label}
            clickable
            color={selected === p.id ? 'primary' : 'default'}
            variant={selected === p.id ? 'filled' : 'outlined'}
            onClick={() => onSelect(p.id)}
            sx={{ py: 2.5, px: 0.5, fontSize: '0.9rem' }}
          />
        ))}
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
