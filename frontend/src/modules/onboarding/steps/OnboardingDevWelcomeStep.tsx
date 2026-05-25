import { Box, Button, Stack, Typography, alpha } from '@mui/material'
import TerminalIcon from '@mui/icons-material/Terminal'
import EuroIcon from '@mui/icons-material/Euro'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import SpeedIcon from '@mui/icons-material/Speed'

const HIGHLIGHTS = [
  {
    icon: <TerminalIcon color="primary" />,
    title: 'Pensé pour coder',
    text: 'Catalogue de prestations aligné sur votre stack — pas un ERP générique.',
  },
  {
    icon: <EuroIcon color="primary" />,
    title: 'Vos prix, votre marge',
    text: 'Tarifs modifiables sur chaque produit, prêts pour devis et factures.',
  },
  {
    icon: <Inventory2OutlinedIcon color="primary" />,
    title: 'Offre clé en main',
    text: 'Modèles inspirés de prestations dev réelles : sites, API, maintenance, IA.',
  },
  {
    icon: <SpeedIcon color="primary" />,
    title: 'Budget maîtrisé',
    text: 'Idéal quand on démarre : peu de clients, beaucoup de techno, peu de temps admin.',
  },
] as const

type Props = {
  onNext: () => void
}

export function OnboardingDevWelcomeStep({ onNext }: Props) {
  return (
    <Box>
      <Box
        sx={(theme) => ({
          p: 2.5,
          mb: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: alpha(theme.palette.primary.main, 0.25),
          bgcolor: alpha(theme.palette.primary.main, 0.06),
        })}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Facturio est réservé aux développeurs
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Freelances, indie hackers, petites structures tech : on vous aide à facturer comme vous codez —
          sans tableur ni catalogue figé hérité d&apos;un autre métier.
        </Typography>
      </Box>

      <Stack spacing={2} sx={{ mb: 3 }}>
        {HIGHLIGHTS.map((item) => (
          <Stack key={item.title} direction="row" spacing={2} alignItems="flex-start">
            <Box sx={{ mt: 0.25 }}>{item.icon}</Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {item.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {item.text}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Stack>

      <Button variant="contained" size="large" fullWidth onClick={onNext}>
        C&apos;est pour moi — continuer
      </Button>
    </Box>
  )
}
