import { Chip, Tooltip } from '@mui/material'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import type { InvoiceInstallmentSummary } from '../../../utils/invoiceInstallmentLabels'
import { installmentBadgeLabel } from '../../../utils/invoiceInstallmentLabels'
import { formatCurrency, formatDate } from '../../../utils/formatters'

type Props = {
  summary: InvoiceInstallmentSummary
  size?: 'small' | 'medium'
}

/**
 * Badge compact pour signaler un plan de paiement en plusieurs fois (liste factures).
 */
export function InvoiceInstallmentBadge({ summary, size = 'small' }: Props) {
  const label = installmentBadgeLabel(summary)
  const color = summary.hasOverdue ? 'error' : summary.pendingCount === 0 ? 'success' : 'info'

  const tooltipParts = [
    `${summary.totalCount} échéance(s)`,
    summary.paidCount > 0 ? `${summary.paidCount} réglée(s)` : null,
    summary.nextAmount != null && summary.nextDueDate
      ? `Prochaine : ${formatCurrency(summary.nextAmount)} le ${formatDate(summary.nextDueDate)}`
      : null,
  ].filter(Boolean)

  return (
    <Tooltip title={tooltipParts.join(' · ')}>
      <Chip
        size={size}
        icon={<CalendarMonthIcon />}
        label={label}
        color={color}
        variant="outlined"
        sx={{ maxWidth: '100%' }}
      />
    </Tooltip>
  )
}
