import { useEffect, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import { PageHeader } from '../../components/finance/PageHeader'
import {
  financeCardSx,
  financeKpiGradients,
  financePagePadding,
} from '../../components/finance/financeStyles'
import { BillingFeatureGate } from '../../components/billing/BillingFeatureGate'
import { formatCurrency } from '../../utils/formatters'
import { treasuryService, type TreasuryForecast } from '../../services/treasury'

/**
 * Tableau de bord trésorerie 30/90/180 jours.
 */
export function TreasuryPage() {
  const [days, setDays] = useState(90)
  const [data, setData] = useState<TreasuryForecast | null>(null)

  useEffect(() => {
    treasuryService
      .getForecast(days)
      .then(setData)
      .catch(() => setData(null))
  }, [days])

  const kpis = data
    ? [
        { label: 'Encaissements prévus', value: data.totalInflows, accent: financeKpiGradients.revenue },
        { label: 'Décaissements prévus', value: data.totalOutflows, accent: financeKpiGradients.unpaid },
        {
          label: 'Solde projeté',
          value: data.closingProjected,
          accent: financeKpiGradients.clients,
        },
      ]
    : []

  return (
    <BillingFeatureGate feature="accounting" featureLabel="La trésorerie">
      <Box sx={{ p: financePagePadding }}>
        <PageHeader
          title="Trésorerie"
          subtitle="Prévision des encaissements et décaissements à partir de vos factures et dettes"
          actions={
            <ToggleButtonGroup
              size="small"
              exclusive
              value={days}
              onChange={(_, v) => v && setDays(v)}
            >
              <ToggleButton value={30}>30 j</ToggleButton>
              <ToggleButton value={90}>90 j</ToggleButton>
              <ToggleButton value={180}>180 j</ToggleButton>
            </ToggleButtonGroup>
          }
        />

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {kpis.map((k) => (
            <Grid key={k.label} size={{ xs: 12, sm: 4 }}>
              <Card sx={financeCardSx}>
                <Box sx={{ height: 4, background: k.accent }} />
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    {k.label}
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {formatCurrency(k.value)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {!data ? (
          <Typography color="text.secondary">Chargement de la prévision…</Typography>
        ) : (
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Échéances à encaisser
              </Typography>
              <UpcomingTable rows={data.upcomingReceivables} empty="Aucune créance à venir" />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Échéances à payer
              </Typography>
              <UpcomingTable rows={data.upcomingPayables} empty="Aucune dette à venir" />
            </Box>
          </Stack>
        )}
      </Box>
    </BillingFeatureGate>
  )
}

function UpcomingTable({
  rows,
  empty,
}: {
  rows: Array<{ dueDate: string; amount: number; label: string }>
  empty: string
}) {
  if (!rows.length) {
    return <Typography color="text.secondary">{empty}</Typography>
  }
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Échéance</TableCell>
          <TableCell>Libellé</TableCell>
          <TableCell align="right">Montant</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((r, i) => (
          <TableRow key={`${r.dueDate}-${r.label}-${i}`}>
            <TableCell>{r.dueDate}</TableCell>
            <TableCell>{r.label}</TableCell>
            <TableCell align="right">{formatCurrency(r.amount)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
