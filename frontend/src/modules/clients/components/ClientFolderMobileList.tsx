import {
  Avatar,
  Box,
  Card,
  Chip,
  Stack,
  Typography,
} from '@mui/material'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import type { Client } from '../../../services/clients'
import { formatCurrency, formatDate } from '../../../utils/formatters'
import { ClientRowActionsMenu } from './ClientRowActionsMenu'

type ClientFolderMobileListProps = {
  clients: Client[]
  getStatusLabel: (s: Client['status']) => string
  getStatusColor: (s: Client['status']) => 'success' | 'default' | 'warning'
  onView: (c: Client) => void
  onEdit: (c: Client) => void
  onDelete: (c: Client) => void
  onNewQuote: (c: Client) => void
  onNewInvoice: (c: Client) => void
}

export function ClientFolderMobileList({
  clients,
  getStatusLabel,
  getStatusColor,
  onView,
  onEdit,
  onDelete,
  onNewQuote,
  onNewInvoice,
}: ClientFolderMobileListProps) {
  return (
    <Stack spacing={1}>
      {clients.map((client) => (
        <Card
          key={client.id}
          variant="outlined"
          sx={{ borderRadius: 2, border: 1, borderColor: 'divider', overflow: 'hidden' }}
        >
          <Box sx={{ px: 1.5, py: 1.25 }}>
            <Stack direction="row" spacing={1.25} alignItems="flex-start">
              <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontSize: '0.95rem' }}>
                {client.name.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" justifyContent="space-between" spacing={1}>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" fontWeight={700} noWrap>
                      {client.name}
                    </Typography>
                    {client.company?.name && (
                      <Typography variant="caption" color="text.secondary" noWrap display="block">
                        {client.company.name}
                      </Typography>
                    )}
                  </Box>
                  <Chip
                    label={getStatusLabel(client.status)}
                    color={getStatusColor(client.status)}
                    size="small"
                    sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, flexShrink: 0 }}
                  />
                </Stack>
                <Stack spacing={0.35} sx={{ mt: 0.75 }}>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <EmailIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" noWrap>
                      {client.email}
                    </Typography>
                  </Stack>
                  {client.phone && (
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <PhoneIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption">{client.phone}</Typography>
                    </Stack>
                  )}
                </Stack>
                <Stack direction="row" spacing={2} sx={{ mt: 0.75 }}>
                  <Typography variant="caption" color="text.secondary">
                    CA :{' '}
                    <Typography component="span" variant="caption" fontWeight={700} color="text.primary">
                      {formatCurrency(client.revenueTotal ?? 0)}
                    </Typography>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {client.lastInvoiceAt
                      ? `Dernière : ${formatDate(client.lastInvoiceAt)}`
                      : 'Aucune facture'}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </Box>
          <Stack direction="row" justifyContent="flex-end" sx={{ px: 1, pb: 1 }}>
            <ClientRowActionsMenu
              onView={() => onView(client)}
              onEdit={() => onEdit(client)}
              onDelete={() => onDelete(client)}
              onNewQuote={() => onNewQuote(client)}
              onNewInvoice={() => onNewInvoice(client)}
            />
          </Stack>
        </Card>
      ))}
    </Stack>
  )
}
