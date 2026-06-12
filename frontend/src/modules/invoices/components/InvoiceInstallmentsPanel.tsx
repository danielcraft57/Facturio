import {
  Alert,
  Box,
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import type { InvoiceInstallment } from '../../../services/invoiceInstallments'
import { formatCurrency, formatDate } from '../../../utils/formatters'

type Props = {
  installments: InvoiceInstallment[]
  canEdit: boolean
  onConfigure: () => void
  /** Facture envoyée au client — requis pour relancer. */
  canRemind?: boolean
  onRemind?: (installmentId: number) => void | Promise<void>
  reminding?: boolean
}

function statusChip(row: InvoiceInstallment) {
  if (row.status === 'PAID') {
    return <Chip size="small" label="Réglée" color="success" variant="outlined" />
  }
  if (row.status === 'CANCELLED') {
    return <Chip size="small" label="Annulée" variant="outlined" />
  }
  if (row.overdue) {
    return <Chip size="small" label="En retard" color="error" variant="outlined" />
  }
  return <Chip size="small" label="À venir" color="warning" variant="outlined" />
}

/**
 * Affiche l'échéancier de paiement métier sur la fiche facture.
 */
export function InvoiceInstallmentsPanel({
  installments,
  canEdit,
  onConfigure,
  canRemind,
  onRemind,
  reminding,
}: Props) {
  const hasPlan = installments.length > 0
  const next = installments.find((r) => r.status === 'PENDING') ?? null

  return (
    <Box sx={{ mt: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <CalendarMonthIcon fontSize="small" color="action" />
          <Typography variant="h6">Échéancier de paiement</Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          {canRemind && next && onRemind && (
            <Button
              size="small"
              variant="contained"
              color="warning"
              disabled={reminding}
              onClick={() => onRemind(next.id)}
            >
              Relancer l'échéance
            </Button>
          )}
          {canEdit && (
            <Button size="small" variant="outlined" onClick={onConfigure}>
              {hasPlan ? 'Modifier' : 'Configurer'}
            </Button>
          )}
        </Stack>
      </Stack>

      {!hasPlan && (
        <Alert severity="info" variant="outlined">
          Aucun échéancier. Proposez un paiement en plusieurs fois à votre client (ex. 3 mensualités
          égales).
        </Alert>
      )}

      {next && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Prochaine échéance : {formatCurrency(next.amount)} le {formatDate(next.dueDate)}
          {next.overdue ? ' (en retard)' : ''}
        </Typography>
      )}

      {hasPlan && (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Échéance</TableCell>
                <TableCell align="right">Montant</TableCell>
                <TableCell>Statut</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {installments.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.sequence}</TableCell>
                  <TableCell>{formatDate(row.dueDate)}</TableCell>
                  <TableCell align="right">{formatCurrency(row.amount)}</TableCell>
                  <TableCell>{statusChip(row)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}
