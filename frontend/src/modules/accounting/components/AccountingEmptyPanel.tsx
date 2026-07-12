import { Box, Button, Stack, Typography } from '@mui/material'
import SyncIcon from '@mui/icons-material/Sync'
import AddIcon from '@mui/icons-material/Add'
import { Link as RouterLink } from 'react-router-dom'
import { demoService } from '../../../services/demoService'

type Props = {
  title: string
  description: string
  onSync?: () => void
  syncing?: boolean
}

/**
 * Empty state compta avec CTA synchronisation et création facture.
 */
export function AccountingEmptyPanel({ title, description, onSync, syncing = false }: Props) {
  const isDemo = demoService.isDemoSession()

  return (
    <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
      <Stack spacing={1.5} alignItems="center" sx={{ maxWidth: 440, mx: 'auto' }}>
        <Typography variant="subtitle1" fontWeight={700}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
          {description}
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ pt: 0.5 }}>
          {onSync ? (
            <Button
              variant="contained"
              startIcon={<SyncIcon />}
              onClick={onSync}
              disabled={syncing}
            >
              {syncing ? 'Synchronisation…' : 'Synchroniser factures'}
            </Button>
          ) : null}
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            component={RouterLink}
            to="/factures/inbox?create=1"
          >
            {isDemo ? 'Aperçu : créer une facture' : 'Créer une facture'}
          </Button>
          {isDemo ? (
            <Button variant="text" component={RouterLink} to="/signup?from=demo">
              S&apos;inscrire pour enregistrer
            </Button>
          ) : null}
        </Stack>
      </Stack>
    </Box>
  )
}
