import { Box, Button, Stack, Typography } from '@mui/material'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline'
import { Link as RouterLink } from 'react-router-dom'
import { demoService } from '../../services/demoService'

type Props = {
  resource: 'factures' | 'clients'
  actionTo: string
  actionLabel: string
}

const META = {
  factures: {
    icon: ReceiptLongOutlinedIcon,
    title: "Aucune facture pour l'instant",
    hint: "Créez votre première facture pour voir l'activité ici.",
  },
  clients: {
    icon: PeopleOutlineIcon,
    title: 'Aucun client récent',
    hint: 'Ajoutez un client pour démarrer vos devis et factures.',
  },
} as const

/**
 * Empty state compact pour les blocs « récents » du tableau de bord.
 */
export function DashboardRecentEmptyState({ resource, actionTo, actionLabel }: Props) {
  const meta = META[resource]
  const Icon = meta.icon
  const isDemo = demoService.isDemoSession()

  return (
    <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
      <Stack spacing={1.5} alignItems="center">
        <Icon sx={{ fontSize: 36, color: 'primary.main', opacity: 0.75 }} />
        <Typography variant="subtitle1" fontWeight={700}>
          {meta.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320, lineHeight: 1.55 }}>
          {meta.hint}
        </Typography>
        {isDemo ? (
          <Button variant="contained" component={RouterLink} to="/signup?from=demo" sx={{ mt: 0.5 }}>
            Créer mon compte pour facturer
          </Button>
        ) : (
          <Button variant="contained" component={RouterLink} to={actionTo} sx={{ mt: 0.5 }}>
            {actionLabel}
          </Button>
        )}
      </Stack>
    </Box>
  )
}
