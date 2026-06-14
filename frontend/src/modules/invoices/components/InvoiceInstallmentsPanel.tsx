import {
  Alert,
  Box,
  Button,
  Chip,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'
import { Link as RouterLink } from 'react-router-dom'
import type {
  InstallmentAccountingLink,
  InvoiceInstallment,
} from '../../../services/invoiceInstallments'
import { formatCurrency, formatDate } from '../../../utils/formatters'
import { AGING_BUCKET_LABELS } from '../../../services/receivables'
import {
  formatInstallmentAccountingLabel,
  formatInstallmentReceivableLabel,
} from '../../../utils/installmentFinanceLabels'

type Props = {
  installments: InvoiceInstallment[]
  saleAccounting?: InstallmentAccountingLink | null
  canEdit: boolean
  onConfigure: () => void
  /** Facture envoyée au client — requis pour relancer. */
  canRemind?: boolean
  onRemind?: (installmentId: number) => void | Promise<void>
  reminding?: boolean
  onRelease?: (installmentId: number) => void | Promise<void>
  releasing?: boolean
}

/** Indique si une mensualité programmée peut être envoyée au client. */
function canReleaseScheduledRow(row: InvoiceInstallment, all: InvoiceInstallment[]): boolean {
  if (row.status !== 'SCHEDULED') return false
  for (const prev of all) {
    if (prev.sequence >= row.sequence) continue
    if (prev.status !== 'PAID') return false
  }
  return true
}

function statusChip(row: InvoiceInstallment) {
  if (row.status === 'PAID') {
    return <Chip size="small" label="Réglée" color="success" variant="outlined" />
  }
  if (row.status === 'CANCELLED') {
    return <Chip size="small" label="Annulée" variant="outlined" />
  }
  if (row.status === 'SCHEDULED') {
    return <Chip size="small" label="Programmée" variant="outlined" />
  }
  if (row.overdue) {
    return <Chip size="small" label="En retard" color="error" variant="outlined" />
  }
  return <Chip size="small" label="À régler" color="warning" variant="outlined" />
}

function AccountingCell({ accounting }: { accounting: InstallmentAccountingLink | null | undefined }) {
  if (!accounting) {
    return (
      <Typography variant="caption" color="text.secondary">
        —
      </Typography>
    )
  }
  const label = formatInstallmentAccountingLabel(
    accounting.journalCode,
    accounting.reference,
    accounting.posted,
  )
  return (
    <Tooltip
      title={
        accounting.posted
          ? `${accounting.reference} · ${formatDate(accounting.date)}`
          : 'Écriture générée à l’encaissement ou à l’émission de la facture'
      }
    >
      <Chip
        size="small"
        variant="outlined"
        color={accounting.posted ? 'default' : 'warning'}
        label={label}
        component={RouterLink}
        to="/comptabilite"
        clickable
        sx={{ maxWidth: '100%' }}
      />
    </Tooltip>
  )
}

function ReceivableCell({ row }: { row: InvoiceInstallment }) {
  if (row.status !== 'PENDING' || !row.receivable) {
    return (
      <Typography variant="caption" color="text.secondary">
        —
      </Typography>
    )
  }
  const { receivable } = row
  const label = formatInstallmentReceivableLabel(receivable.agingBucket, receivable.daysPastDue)
  return (
    <Stack spacing={0.25}>
      <Chip
        size="small"
        color={receivable.daysPastDue > 0 ? 'error' : 'info'}
        variant="outlined"
        label={label}
        component={RouterLink}
        to="/creances"
        clickable
      />
      <Typography variant="caption" color="text.secondary">
        {AGING_BUCKET_LABELS[receivable.agingBucket]} · {formatCurrency(receivable.outstanding)}
      </Typography>
    </Stack>
  )
}

/**
 * Affiche l'échéancier de paiement métier sur la fiche facture (créances + compta).
 */
export function InvoiceInstallmentsPanel({
  installments,
  saleAccounting,
  canEdit,
  onConfigure,
  canRemind,
  onRemind,
  reminding,
  onRelease,
  releasing,
}: Props) {
  const hasPlan = installments.length > 0
  const next = installments.find((r) => r.status === 'PENDING') ?? null
  const nextReleasable =
    installments.find((r) => canReleaseScheduledRow(r, installments)) ?? null
  const pendingReceivableTotal = installments
    .filter((r) => r.status === 'PENDING')
    .reduce((sum, r) => sum + (r.receivable?.outstanding ?? r.amount), 0)

  return (
    <Box sx={{ mt: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <CalendarMonthIcon fontSize="small" color="action" />
          <Typography variant="h6">Échéancier de paiement</Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          {nextReleasable && onRelease && (
            <Button
              size="small"
              variant="contained"
              color="primary"
              disabled={releasing}
              onClick={() => onRelease(nextReleasable.id)}
            >
              Envoyer la mensualité
            </Button>
          )}
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
          égales). Les créances et écritures comptables seront suivies automatiquement.
        </Alert>
      )}

      {hasPlan && saleAccounting && (
        <Alert
          severity={saleAccounting.posted ? 'success' : 'info'}
          variant="outlined"
          icon={<AccountBalanceOutlinedIcon fontSize="inherit" />}
          sx={{ mb: 1.5 }}
        >
          <Typography variant="body2">
            <strong>Vente comptable :</strong>{' '}
            {saleAccounting.posted ? (
              <>
                écriture {saleAccounting.journalCode} postée (
                <Link component={RouterLink} to="/comptabilite" underline="hover">
                  {saleAccounting.reference}
                </Link>
                )
              </>
            ) : (
              <>sera générée à l&apos;émission de la facture ({saleAccounting.reference})</>
            )}
            . Chaque encaissement d&apos;échéance crée une écriture BQ (512/411).
          </Typography>
        </Alert>
      )}

      {nextReleasable && !next && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Mensualité n°{nextReleasable.sequence} programmée ({formatCurrency(nextReleasable.amount)}{' '}
          le {formatDate(nextReleasable.dueDate)}) — envoyez-la au client ou attendez le cron (J-3).
        </Typography>
      )}

      {next && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Prochaine échéance : {formatCurrency(next.amount)} le {formatDate(next.dueDate)}
          {next.overdue ? ' (en retard)' : ''}
          {pendingReceivableTotal > 0 && (
            <>
              {' '}
              ·{' '}
              <Link component={RouterLink} to="/creances" underline="hover">
                {formatCurrency(pendingReceivableTotal)} en créances auto
              </Link>
            </>
          )}
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
                <TableCell>Créance</TableCell>
                <TableCell>Comptabilité</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {installments.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.sequence}</TableCell>
                  <TableCell>{formatDate(row.dueDate)}</TableCell>
                  <TableCell align="right">{formatCurrency(row.amount)}</TableCell>
                  <TableCell>{statusChip(row)}</TableCell>
                  <TableCell>
                    <ReceivableCell row={row} />
                  </TableCell>
                  <TableCell>
                    <AccountingCell accounting={row.accounting} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}
