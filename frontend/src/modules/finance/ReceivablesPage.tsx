import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FinanceRealtimeDetail } from '../../types/realtime'
import { scheduleDebounced } from '../../utils/scheduleDebounced'
import { Link as RouterLink } from 'react-router-dom'
import { openClientView } from '../../utils/openDocumentView'
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
import { BillingFeatureGate } from '../../components/billing/BillingFeatureGate'
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
  RECEIVABLE_DOCUMENT_KIND_LABELS,
  receivablesService,
  type ReceivableAgingBucket,
  type ReceivableDocumentKind,
  type ReceivablesData,
} from '../../services/receivables'
import { invoiceService } from '../../services/invoices'
import { financeKpiGridSize } from './financePageLayout'
import { WorkspacePreparationDialog } from '../../components/loading/WorkspacePreparationDialog'
import { TablePageSkeleton } from '../../components/loading/TablePageSkeleton'

const AGING_ORDER: ReceivableAgingBucket[] = [
  'not_due',
  'days_0_30',
  'days_31_60',
  'days_61_90',
  'days_90_plus',
]

const KIND_FILTERS: Array<{ value: ReceivableDocumentKind | 'all'; label: string }> = [
  { value: 'all', label: 'Toutes' },
  { value: 'deposit', label: 'Acomptes' },
  { value: 'remainder', label: 'Soldes' },
  { value: 'standard', label: 'Factures' },
]

function KpiCard({
  label,
  value,
  gradient,
  subtitle,
}: {
  label: string
  value: string
  gradient: string
  subtitle?: string
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
        {subtitle && (
          <Typography variant="caption" sx={{ opacity: 0.85, display: 'block', mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

function agingChipColor(bucket: ReceivableAgingBucket): 'default' | 'warning' | 'error' {
  if (bucket === 'not_due') return 'default'
  if (bucket === 'days_90_plus' || bucket === 'days_61_90') return 'error'
  return 'warning'
}

function documentKindChipColor(kind: ReceivableDocumentKind): 'default' | 'primary' | 'secondary' {
  if (kind === 'deposit') return 'primary'
  if (kind === 'remainder') return 'secondary'
  return 'default'
}

export function ReceivablesPage() {
  const [data, setData] = useState<ReceivablesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState(0)
  const [kindFilter, setKindFilter] = useState<ReceivableDocumentKind | 'all'>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [remindingId, setRemindingId] = useState<string | null>(null)
  const [bulkReminding, setBulkReminding] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await receivablesService.getReceivables({
        ...(startDate ? { start: startDate } : {}),
        ...(endDate ? { end: endDate } : {}),
        ...(kindFilter !== 'all' ? { kind: kindFilter } : {}),
      })
      setData(res)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les créances')
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, kindFilter])

  useEffect(() => {
    void load()
  }, [load])

  const loadRef = useRef(load)
  loadRef.current = load

  useEffect(() => {
    const onRealtime = (ev: Event) => {
      const detail = (ev as CustomEvent<FinanceRealtimeDetail>).detail
      if (detail?.id == null) return
      scheduleDebounced(() => void loadRef.current())
    }
    window.addEventListener('facturio:invoice-realtime', onRealtime)
    return () => window.removeEventListener('facturio:invoice-realtime', onRealtime)
  }, [])

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

  const handleBulkRemind = async () => {
    if (
      !window.confirm(
        'Relancer toutes les créances en retard éligibles ? (≥ 3 j après échéance, pas de relance depuis 7 j)',
      )
    ) {
      return
    }
    setBulkReminding(true)
    try {
      const result = await receivablesService.remindOverdue()
      if (result.errors.length) {
        setError(`${result.sent} relance(s) envoyée(s). ${result.errors.join(' · ')}`)
      }
      await load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors des relances groupées')
    } finally {
      setBulkReminding(false)
    }
  }

  const overdueCount = useMemo(() => {
    if (!data) return 0
    return data.invoices.filter((i) => i.agingBucket !== 'not_due').length
  }, [data])

  const installmentOverdueCount = useMemo(() => {
    if (!data) return 0
    return (data.installmentReceivables ?? []).filter((r) => r.overdue).length
  }, [data])

  const byKind = data?.summary.byKind ?? { standard: 0, deposit: 0, remainder: 0 }
  const installmentReceivables = data?.installmentReceivables ?? []
  const initialLoading = loading && data === null

  return (
    <BillingFeatureGate feature="financeModule" featureLabel="Le suivi des créances clients">
    <Box sx={{ p: financePagePadding }}>
      <WorkspacePreparationDialog open={initialLoading} resource="creances" />
      <PageHeader
        title="Créances clients"
        subtitle="Factures impayées — acompte à l'acceptation, solde J+30 à l'envoi, relances auto chaque matin"
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={
                bulkReminding ? <CircularProgress size={18} color="inherit" /> : <Email />
              }
              onClick={() => void handleBulkRemind()}
              disabled={bulkReminding || loading}
              sx={financeOutlinedButtonSx}
            >
              Relancer les retards
            </Button>
            <Button
              variant="outlined"
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Refresh />}
              onClick={() => void load()}
              disabled={loading}
              sx={financeOutlinedButtonSx}
            >
              Actualiser
            </Button>
          </Stack>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3, ...financeCardSx }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
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
            <Tabs
              value={kindFilter}
              onChange={(_, v: ReceivableDocumentKind | 'all') => setKindFilter(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ minHeight: 40 }}
            >
              {KIND_FILTERS.map((f) => (
                <Tab key={f.value} value={f.value} label={f.label} sx={{ minHeight: 40, py: 0 }} />
              ))}
            </Tabs>
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
            label="Acomptes dus"
            value={formatCurrency(byKind.deposit)}
            gradient={financeKpiGradients.clients}
            subtitle="Échéance : jour de l'acceptation"
          />
        </Grid>
        <Grid size={financeKpiGridSize}>
          <KpiCard
            label="Soldes dus"
            value={formatCurrency(byKind.remainder)}
            gradient={financeKpiGradients.conversion}
            subtitle="Échéance : J+30 à l'envoi"
          />
        </Grid>
        <Grid size={financeKpiGridSize}>
          <KpiCard
            label="Échéances planifiées"
            value={formatCurrency(data?.summary.installmentOutstanding ?? 0)}
            gradient={financeKpiGradients.revenue}
            subtitle={`${data?.summary.installmentCount ?? 0} échéance(s) · ${installmentOverdueCount} en retard`}
          />
        </Grid>
        <Grid size={financeKpiGridSize}>
          <KpiCard
            label="Factures en retard"
            value={String(overdueCount)}
            gradient={financeKpiGradients.unpaid}
            subtitle={`${data?.summary.invoiceCount ?? 0} facture(s) ouverte(s)`}
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
          <Tab label={`Échéances (${installmentReceivables.length})`} />
        </Tabs>
        {loading ? (
          initialLoading ? (
            <Box sx={{ p: 2 }}>
              <TablePageSkeleton rows={8} showHeader={false} />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          )
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
                          component="button"
                          type="button"
                          onClick={() => openClientView(c.clientId)}
                          underline="hover"
                          fontWeight={600}
                          sx={{
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            p: 0,
                            font: 'inherit',
                            color: 'primary.main',
                            textAlign: 'left',
                          }}
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
                          onClick={() => openClientView(c.clientId)}
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
        ) : tab === 1 ? (
          <TableContainer>
            <Table size="small" sx={financeTableSx}>
              <TableHead sx={financeTableHeadSx}>
                <TableRow>
                  <TableCell>Facture</TableCell>
                  <TableCell>Type</TableCell>
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
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
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
                        {inv.quoteId && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            Devis lié
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={RECEIVABLE_DOCUMENT_KIND_LABELS[inv.documentKind]}
                          color={documentKindChipColor(inv.documentKind)}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Link
                          component="button"
                          type="button"
                          onClick={() => openClientView(inv.clientId)}
                          underline="hover"
                          sx={{
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            p: 0,
                            font: 'inherit',
                            color: 'primary.main',
                            textAlign: 'left',
                          }}
                        >
                          {inv.clientName}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {inv.dueDate ? formatDate(inv.dueDate) : formatDate(inv.date)}
                        {inv.lastReminderAt && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            Relancé {formatDate(inv.lastReminderAt)}
                          </Typography>
                        )}
                      </TableCell>
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
                  <TableCell>Échéance</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Ancienneté</TableCell>
                  <TableCell align="right">Montant</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {installmentReceivables.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      Aucune échéance de plan en cours
                    </TableCell>
                  </TableRow>
                ) : (
                  installmentReceivables.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <Link
                          component={RouterLink}
                          to={`/factures/voir/${row.invoiceId}`}
                          underline="hover"
                          fontWeight={600}
                        >
                          {row.invoiceNumber}
                        </Link>
                        <Typography variant="caption" display="block" color="text.secondary">
                          #{row.sequence} · créance auto
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={`Éch. ${row.sequence}`} variant="outlined" />
                      </TableCell>
                      <TableCell>{row.clientName}</TableCell>
                      <TableCell>{formatDate(row.dueDate)}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={
                            row.daysPastDue > 0
                              ? `${row.daysPastDue} j de retard`
                              : AGING_BUCKET_LABELS[row.agingBucket]
                          }
                          color={agingChipColor(row.agingBucket)}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {formatCurrency(row.amount)}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          component={RouterLink}
                          to={`/factures/voir/${row.invoiceId}`}
                          endIcon={<OpenInNew fontSize="inherit" />}
                        >
                          Facture
                        </Button>
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
    </BillingFeatureGate>
  )
}
