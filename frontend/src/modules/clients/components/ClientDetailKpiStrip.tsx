import { Box, Card, CardContent, Grid, Typography } from '@mui/material'
import type { ClientFinanceBalances } from '../../../services/clientFinance'
import { formatCurrency } from '../../../utils/formatters'

type Props = {
  balances: ClientFinanceBalances
  invoiceCount: number
  quoteCount: number
}

function KpiCard({
  label,
  value,
  color = 'text.primary',
  hint,
}: {
  label: string
  value: string
  color?: string
  hint?: string
}) {
  return (
    <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
          {label}
        </Typography>
        <Typography variant="h6" fontWeight={800} color={color} sx={{ lineHeight: 1.2 }}>
          {value}
        </Typography>
        {hint && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
            {hint}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

export function ClientDetailKpiStrip({ balances, invoiceCount, quoteCount }: Props) {
  return (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <KpiCard
            label="Encours à payer"
            value={formatCurrency(balances.outstandingBalance)}
            color={balances.outstandingBalance > 0.01 ? 'warning.main' : 'success.main'}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <KpiCard
            label="Crédits dispo."
            value={formatCurrency(balances.totalCreditsAvailable)}
            color="info.main"
            hint="Avoirs libres"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <KpiCard
            label="Encaissé net"
            value={formatCurrency(balances.totalPaidNet)}
            color="success.main"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <KpiCard label="Facturé TTC" value={formatCurrency(balances.totalInvoicedTtc)} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
          <KpiCard
            label="Documents"
            value={`${invoiceCount} fac. · ${quoteCount} dev.`}
            hint={`Avoirs imputés ${formatCurrency(balances.totalCreditsApplied)}`}
          />
        </Grid>
      </Grid>
    </Box>
  )
}
