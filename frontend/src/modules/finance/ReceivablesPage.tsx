import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Link,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { Email, OpenInNew, Refresh } from '@mui/icons-material'
import { PageHeader } from '../../components/finance/PageHeader'
import {
  financeCardSx,
  financeKpiGradients,
  financeOutlinedButtonSx,
  financePagePadding,
  financeTableHeadSx,
  financeTableSx,
} from '../../components/finance/financeStyles'
import { formatCurrency, formatDate } from '../../utils/formatters'
import {
  AGING_BUCKET_LABELS,
  receivablesService,
  type ReceivableAgingBucket,
  type ReceivablesData,
} from '../../services/receivables'
import { invoiceService } from '../../services/invoices'
import { financeKpiGridSize } from './financePageLayout'

const AGING_ORDER: ReceivableAgingBucket[] = [
  'not_due',
  'days_0_30',
  'days_31_60',
  'days_61_90',
  'days_90_plus',
]

function KpiCard({
  label,
  value,
  gradient,
}: {
  label: string
  value: string
  gradient: string
}) {
  return (
    <Card
      sx={{
        ...financeCardSx,
        background: gradient,
        color: '#fff',
        height: '100%',
      }}
    >
      <CardContent>
        <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 600 }}>
          {label}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  )
}

function agingChipColor(bucket: ReceivableAgingBucket): 'default' | 'warning' | 'error' {
  if (bucket === 'not_due') return 'default'
  if (bucket === 'days_90_plus' || bucket === 'days_61_90') return 'error'
  return 'warning'
}

export function ReceivablesPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<ReceivablesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState(0)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [remindingId, setRemindingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await receivablesService.getReceivables({
        ...(startDate ? { start: startDate } : {}),
        ...(endDate ? { end: endDate } : {}),
      })
      setData(res)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les créances')
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => {
    void load()
  }, [load])

  const handleRemind = async (invoiceId: string) => {
    if (!window.confirm('Envoyer une relance par email pour cette facture ?')) return
    setRemindingId(invoiceId)
    try {
      await invoiceService.sendReminder(invoiceId)
      await load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la relance')
    } finally {
      setRemindingId(null)
    }
  }

  const overdueCount = useMemo(() => {
    if (!data) return 0
    return data.invoices.filter((i) => i.agingBucket !== 'not_due').length
  }, [data])

  return (
    <Box sx={{ p: financePagePadding }}>
      <PageHeader
        title="Créances clients"
        subtitle="Clients qui vous doivent (factures impayées) — pas les créanciers des dettes"
        actions={
          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Refresh />}
            onClick={() => void load()}
            disabled={loading}
            sx={financeOutlinedButtonSx}
          >
            Actualiser
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3, ...financeCardSx }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Factures depuis"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              sx={{ maxWidth: 220 }}
            />
            <TextField
              label="Factures jusqu'au"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              sx={{ maxWidth: 220 }}
            />
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={financeKpiGridSize}>
          <KpiCard
            label="Encours total"
            value={formatCurrency(data?.summary.totalOutstanding ?? 0)}
            gradient={financeKpiGradients.unpaid}
          />
        </Grid>
        <Grid size={financeKpiGridSize}>
          <KpiCard
            label="Clients débiteurs"
            value={String(data?.summary.clientCount ?? 0)}
            gradient={financeKpiGradients.clients}
          />
        </Grid>
        <Grid size={financeKpiGridSize}>
          <KpiCard
            label="Factures ouvertes"
            value={String(data?.summary.invoiceCount ?? 0)}
            gradient={financeKpiGradients.conversion}
          />
        </Grid>
        <Grid size={financeKpiGridSize}>
          <KpiCard
            label="En retard"
            value={String(overdueCount)}
            gradient={financeKpiGradients.revenue}
          />
        </Grid>
      </Grid>

      {data && (
        <Card sx={{ mb: 3, ...financeCardSx }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Répartition par ancienneté
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {AGING_ORDER.map((bucket) => (
                <Chip
                  key={bucket}
                  label={`${AGING_BUCKET_LABELS[bucket]} : ${formatCurrency(data.summary.aging[bucket] ?? 0)}`}
                  color={agingChipColor(bucket)}
                  variant="outlined"
                />
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      <Card sx={financeCardSx}>
        <Tabs value={tab} onChange={(_, v: number) => setTab(v)} sx={{ px: 2, pt: 1 }}>
          <Tab label="Par client" />
          <Tab label="Par facture" />
        </Tabs>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : tab === 0 ? (
          <TableContainer>
            <Table size="small" sx={financeTableSx}>
              <TableHead sx={financeTableHeadSx}>
                <TableRow>
                  <TableCell>Client</TableCell>
                  <TableCell align="right">Factures</TableCell>
                  <TableCell align="right">Retard max</TableCell>
                  <TableCell align="right">Encours</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {(data?.clients ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      Aucune créance ouverte
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.clients.map((c) => (
                    <TableRow key={c.clientId} hover>
                      <TableCell>
                        <Link
                          component={RouterLink}
                          to={`/clients/${c.clientId}`}
                          underline="hover"
                          fontWeight={600}
                        >
                          {c.clientName}
                        </Link>
                        {c.clientEmail && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            {c.clientEmail}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">{c.invoiceCount}</TableCell>
                      <TableCell align="right">
                        {c.maxDaysPastDue > 0 ? `${c.maxDaysPastDue} j` : '—'}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {formatCurrency(c.totalBalance)}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          endIcon={<OpenInNew fontSize="inherit" />}
                          onClick={() => navigate(`/clients/${c.clientId}`)}
                        >
                          Fiche
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <TableContainer>
            <Table size="small" sx={financeTableSx}>
              <TableHead sx={financeTableHeadSx}>
                <TableRow>
                  <TableCell>Facture</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Échéance</TableCell>
                  <TableCell>Ancienneté</TableCell>
                  <TableCell align="right">Reste</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {(data?.invoices ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      Aucune facture impayée
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.invoices.map((inv) => (
                    <TableRow key={inv.id} hover>
                      <TableCell>
                        <Link
                          component={RouterLink}
                          to={`/factures/voir/${inv.id}`}
                          underline="hover"
                          fontWeight={600}
                        >
                          {inv.number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          component={RouterLink}
                          to={`/clients/${inv.clientId}`}
                          underline="hover"
                        >
                          {inv.clientName}
                        </Link>
                      </TableCell>
                      <TableCell>{inv.dueDate ? formatDate(inv.dueDate) : formatDate(inv.date)}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={AGING_BUCKET_LABELS[inv.agingBucket]}
                          color={agingChipColor(inv.agingBucket)}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {formatCurrency(inv.balance)}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Button
                            size="small"
                            startIcon={
                              remindingId === inv.id ? (
                                <CircularProgress size={14} color="inherit" />
                              ) : (
                                <Email fontSize="inherit" />
                              )
                            }
                            onClick={() => void handleRemind(inv.id)}
                            disabled={remindingId === inv.id || inv.status === 'DRAFT'}
                          >
                            Relancer
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Box>
  )
}
