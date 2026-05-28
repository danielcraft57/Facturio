import {
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Alert,
} from '@mui/material'
import { OpenInNew } from '@mui/icons-material'
import {
  clientMovementKindLabel,
  type ClientMovement,
  type ClientMovementKind,
} from '../../../services/clientFinance'
import { formatCurrency, formatDate } from '../../../utils/formatters'

type Props = {
  movements: ClientMovement[]
  kindFilter: ClientMovementKind | 'all'
  onOpenInvoice?: (id: string) => void
  onOpenQuote?: (id: string) => void
}

function kindColor(
  kind: ClientMovementKind,
): 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' {
  switch (kind) {
    case 'invoice':
      return 'primary'
    case 'payment':
      return 'success'
    case 'refund':
      return 'warning'
    case 'credit_note':
    case 'misc':
      return 'error'
    case 'credit_applied':
      return 'info'
    default:
      return 'default'
  }
}

export function ClientMovementsTimeline({
  movements,
  kindFilter,
  onOpenInvoice,
  onOpenQuote,
}: Props) {
  const filtered =
    kindFilter === 'all' ? movements : movements.filter((m) => m.kind === kindFilter)

  if (filtered.length === 0) {
    return <Alert severity="info">Aucun mouvement pour ce filtre.</Alert>
  }

  return (
    <TableContainer sx={{ maxHeight: 420, borderRadius: 1, border: 1, borderColor: 'divider' }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Libellé</TableCell>
            <TableCell align="right">Montant</TableCell>
            <TableCell align="center" width={56} />
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.map((m) => (
            <TableRow key={m.id} hover>
              <TableCell>{formatDate(m.date)}</TableCell>
              <TableCell>
                <Chip size="small" label={clientMovementKindLabel(m.kind)} color={kindColor(m.kind)} />
              </TableCell>
              <TableCell>
                <Stack>
                  <Typography variant="body2">{m.label}</Typography>
                  {m.reference && (
                    <Typography variant="caption" color="text.secondary">
                      {m.reference}
                    </Typography>
                  )}
                </Stack>
              </TableCell>
              <TableCell align="right">
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color={
                    m.direction === 'out'
                      ? 'error.main'
                      : m.direction === 'in'
                        ? 'success.main'
                        : 'text.primary'
                  }
                >
                  {m.direction === 'out' ? '−' : m.direction === 'in' ? '+' : ''}
                  {formatCurrency(m.amount)}
                </Typography>
              </TableCell>
              <TableCell align="center">
                {m.invoiceId && onOpenInvoice && (
                  <IconButton size="small" onClick={() => onOpenInvoice(m.invoiceId!)} title="Ouvrir facture">
                    <OpenInNew fontSize="small" />
                  </IconButton>
                )}
                {m.quoteId && onOpenQuote && (
                  <IconButton size="small" onClick={() => onOpenQuote(m.quoteId!)} title="Ouvrir devis">
                    <OpenInNew fontSize="small" />
                  </IconButton>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
