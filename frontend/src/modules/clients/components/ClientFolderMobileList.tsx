import {
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
import { getClientFolderMobileCardSx } from '../clientFolderRowEffects'
import { ClientRowActionsMenu } from './ClientRowActionsMenu'
import { buildClientListRowRail } from './ClientListRowRail'
import { ClientFolderRowIdentity } from './ClientFolderRowIdentity'

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
      {clients.map((client, index) => {
        const railParts = buildClientListRowRail(client, 'card', index)
        return (
          <Card
            key={client.id}
            variant="outlined"
            sx={{
              borderRadius: 2,
              border: 1,
              borderColor: 'divider',
              overflow: 'hidden',
              ...getClientFolderMobileCardSx(railParts.accent, index),
            }}
          >
            <Stack direction="row" alignItems="stretch">
              <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'flex-start', pt: 0.5 }}>
                {railParts.rail}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ px: 1.5, py: 1.25 }}>
                  <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="flex-start">
                    <ClientFolderRowIdentity
                      name={client.name}
                      companyName={client.company?.name}
                    />
                    <Chip
                      label={getStatusLabel(client.status)}
                      color={getStatusColor(client.status)}
                      size="small"
                      sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, flexShrink: 0 }}
                    />
                  </Stack>
                  <Stack spacing={0.35} sx={{ mt: 0.75 }}>
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 0 }}>
                      <EmailIcon sx={{ fontSize: 14, color: 'text.secondary', flexShrink: 0 }} />
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
                  <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mt: 0.75, gap: 0.5 }}>
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
                <Stack direction="row" justifyContent="flex-end" sx={{ px: 1, pb: 1 }}>
                  <ClientRowActionsMenu
                    onView={() => onView(client)}
                    onEdit={() => onEdit(client)}
                    onDelete={() => onDelete(client)}
                    onNewQuote={() => onNewQuote(client)}
                    onNewInvoice={() => onNewInvoice(client)}
                  />
                </Stack>
              </Box>
            </Stack>
          </Card>
        )
      })}
    </Stack>
  )
}
