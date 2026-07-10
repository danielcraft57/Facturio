import { Box, Button, Stack, Typography } from '@mui/material'
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import { Link as RouterLink } from 'react-router-dom'

type Props = {
  variant: 'unread' | 'history'
  hasHistory: boolean
  onShowHistory?: () => void
}

/**
 * Empty state explicatif du centre de notifications.
 */
export function NotificationCenterEmptyState({ variant, hasHistory, onShowHistory }: Props) {
  const isUnread = variant === 'unread'
  const Icon = isUnread ? NotificationsNoneOutlinedIcon : HistoryOutlinedIcon

  return (
    <Box sx={{ py: 4, px: 2.5, textAlign: 'center' }}>
      <Stack spacing={1.5} alignItems="center" sx={{ maxWidth: 300, mx: 'auto' }}>
        <Icon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
        <Typography variant="subtitle2" fontWeight={700}>
          {isUnread ? 'Rien à lire pour l\'instant' : 'Historique vide'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
          {isUnread
            ? 'Ici s\'affichent vos factures et devis créés, les alertes quotas et les rappels beta.'
            : 'Les actions importantes (création, quotas, catalogue) apparaîtront ici au fil de votre activité.'}
        </Typography>
        <Stack direction="column" spacing={1} sx={{ pt: 0.5, width: '100%' }}>
          {isUnread && hasHistory && onShowHistory ? (
            <Button size="small" variant="outlined" onClick={onShowHistory} sx={{ textTransform: 'none' }}>
              Voir l&apos;historique
            </Button>
          ) : null}
          <Button
            component={RouterLink}
            to="/factures/inbox?create=1"
            size="small"
            variant="contained"
            startIcon={<ReceiptLongOutlinedIcon />}
            sx={{ textTransform: 'none' }}
          >
            Créer une facture
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
