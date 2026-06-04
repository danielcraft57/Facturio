import { useCallback, useEffect, useRef, useState } from 'react'
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
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { Add, Refresh } from '@mui/icons-material'
import { useToast } from '../../components/useToast'
import { PageHeader } from '../../components/finance/PageHeader'
import {
  financeCardSx,
  financeKpiGradients,
  financeOutlinedButtonSx,
  financePagePadding,
  financePrimaryButtonSx,
  financeTableHeadSx,
  financeTableSx,
} from '../../components/finance/financeStyles'
import { formatCurrency } from '../../utils/formatters'
import { payablesService, type PayableDebtRow, type PayablesData } from '../../services/payables'
import {
  CreatePayableDebtDialog,
  type CreatePayableDebtPayload,
} from './components/CreatePayableDebtDialog'
import { SendPayableDebtDialog } from './components/SendPayableDebtDialog'
import { SendPayableDebtPaymentNoticeDialog } from './components/SendPayableDebtPaymentNoticeDialog'
import { PayableDebtRowActionsMenu } from './components/PayableDebtRowActionsMenu'
import { RecordPayableDebtPaymentDialog } from './components/RecordPayableDebtPaymentDialog'
import { financeKpiGridSize } from './financePageLayout'
import { resolvePayableDebtDisplayStatus } from './payableDebtDisplayStatus'
import { formatEmailEngagementAt } from '../documents/documentEmailEngagement'
import type { FinanceRealtimeDetail } from '../../types/realtime'
import { getRealtimeRowSx } from '../../utils/realtimeRowHighlight'

function KpiCard({ label, value, gradient }: { label: string; value: string; gradient: string }) {
  return (
    <Card sx={{ ...financeCardSx, background: gradient, color: '#fff', height: '100%' }}>
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

export function PayablesPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [data, setData] = useState<PayablesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debtDialogOpen, setDebtDialogOpen] = useState(false)
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [debtToSend, setDebtToSend] = useState<PayableDebtRow | null>(null)
  const [paymentDialog, setPaymentDialog] = useState<PayableDebtRow | null>(null)
  const [paymentNoticeOpen, setPaymentNoticeOpen] = useState(false)
  const [debtAfterPayment, setDebtAfterPayment] = useState<PayableDebtRow | null>(null)
  const [lastPaymentAmount, setLastPaymentAmount] = useState(0)
  const [saving, setSaving] = useState(false)
  const [highlightDebtId, setHighlightDebtId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const summary = await payablesService.getSummary()
      setData(summary)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les dettes')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadRef = useRef(load)
  useEffect(() => {
    loadRef.current = load
  }, [load])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const onRealtime = (ev: Event) => {
      const detail = (ev as CustomEvent<FinanceRealtimeDetail>).detail
      if (detail?.resource !== 'payables') return
      void loadRef.current()
      const id = detail.id != null ? Number(detail.id) : NaN
      if (Number.isFinite(id)) {
        setHighlightDebtId(id)
        window.setTimeout(() => setHighlightDebtId((cur) => (cur === id ? null : cur)), 4000)
      }
    }
    window.addEventListener('facturio:payables-realtime', onRealtime)
    return () => window.removeEventListener('facturio:payables-realtime', onRealtime)
  }, [])

  const openDebtDialog = () => setDebtDialogOpen(true)

  const handleCreateDebt = async (payload: CreatePayableDebtPayload) => {
    setSaving(true)
    setError(null)
    try {
      const debt = await payablesService.createDebt({
        creditorId: payload.creditorId,
        label: payload.label,
        totalAmount: payload.totalAmount,
        ...(payload.dueDate ? { dueDate: payload.dueDate } : {}),
        ...(payload.notes ? { notes: payload.notes } : {}),
      })
      toast.success('Dette enregistrée')
      setDebtDialogOpen(false)
      setDebtToSend(debt)
      setSendDialogOpen(true)
      await load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur à la création')
    } finally {
      setSaving(false)
    }
  }

  const openSendDialog = (debt: PayableDebtRow) => {
    setDebtToSend(debt)
    setSendDialogOpen(true)
  }

  const handleCopyPublicLink = async (debt: PayableDebtRow) => {
    try {
      const res = debt.publicToken
        ? { url: `${window.location.origin}/dette/${debt.publicToken}` }
        : await payablesService.preparePublicLink(debt.id)
      try {
        await navigator.clipboard.writeText(res.url)
        toast.success('Lien copié')
      } catch {
        window.prompt('Copiez ce lien :', res.url)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Impossible de générer le lien')
    }
  }

  const handleCancelDebt = async (debt: PayableDebtRow) => {
    const ok = window.confirm(
      `Annuler la dette « ${debt.label} » ?\n\nAucune suppression : le dossier reste en historique avec le statut « Annulée ».`,
    )
    if (!ok) return
    setError(null)
    try {
      await payablesService.cancelDebt(debt.id)
      toast.success('Dette annulée')
      await load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Annulation impossible')
    }
  }

  return (
    <Box sx={{ p: financePagePadding }}>
      <PageHeader
        title="Dettes"
        subtitle="Créanciers et remboursements — distinct des clients Facturio (menu Commercial)"
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Refresh />}
              onClick={() => void load()}
              disabled={loading}
              sx={financeOutlinedButtonSx}
            >
              Actualiser
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={openDebtDialog}
              sx={financePrimaryButtonSx}
            >
              Nouvelle dette
            </Button>
          </Stack>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={financeKpiGridSize}>
          <KpiCard
            label="Reste à payer"
            value={formatCurrency(data?.summary.totalOutstanding ?? 0)}
            gradient={financeKpiGradients.unpaid}
          />
        </Grid>
        <Grid size={financeKpiGridSize}>
          <KpiCard
            label="Créanciers"
            value={String(data?.summary.creditorCount ?? 0)}
            gradient={financeKpiGradients.clients}
          />
        </Grid>
        <Grid size={financeKpiGridSize}>
          <KpiCard
            label="Dettes ouvertes"
            value={String(data?.summary.debtCount ?? 0)}
            gradient={financeKpiGradients.conversion}
          />
        </Grid>
      </Grid>

      <Card sx={financeCardSx}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small" sx={financeTableSx}>
              <TableHead sx={financeTableHeadSx}>
                <TableRow>
                  <TableCell>Créancier</TableCell>
                  <TableCell>Libellé</TableCell>
                  <TableCell align="right">Initial</TableCell>
                  <TableCell align="right">Déjà payé</TableCell>
                  <TableCell align="right">Reste</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(data?.debts ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      Aucune dette en cours — ex. créancier « Maman », 164,52 €, puis enregistrer un
                      remboursement de 50 €.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.debts.map((d) => {
                    const display = resolvePayableDebtDisplayStatus(d)
                    const eng = d.emailEngagement
                    const statusTitle = eng?.sentAt
                      ? [
                          eng.sentAt && `Envoyé : ${formatEmailEngagementAt(eng.sentAt)}`,
                          eng.openedAt && `Ouvert : ${formatEmailEngagementAt(eng.openedAt)}`,
                          eng.clickedAt && `Cliqué : ${formatEmailEngagementAt(eng.clickedAt)}`,
                        ]
                          .filter(Boolean)
                          .join('\n')
                      : undefined
                    return (
                    <TableRow
                      key={d.id}
                      hover
                      sx={getRealtimeRowSx(highlightDebtId === d.id, 'updated')}
                    >
                      <TableCell sx={{ fontWeight: 600 }}>
                        <RouterLink
                          to={`/finance/dettes/voir/${d.id}`}
                          style={{ color: 'inherit', textDecoration: 'none', fontWeight: 600 }}
                        >
                          {d.creditorName}
                        </RouterLink>
                      </TableCell>
                      <TableCell>
                        <RouterLink
                          to={`/finance/dettes/voir/${d.id}`}
                          style={{ color: 'inherit', textDecoration: 'underline' }}
                        >
                          {d.label}
                        </RouterLink>
                      </TableCell>
                      <TableCell align="right">{formatCurrency(d.totalAmount)}</TableCell>
                      <TableCell align="right">{formatCurrency(d.totalPaid)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {formatCurrency(d.balance)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={display.label}
                          color={display.color}
                          title={statusTitle}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <PayableDebtRowActionsMenu
                          debt={d}
                          onView={() => navigate(`/finance/dettes/voir/${d.id}`)}
                          onSend={() => openSendDialog(d)}
                          onCopyLink={() => void handleCopyPublicLink(d)}
                          onRecordPayment={() => setPaymentDialog(d)}
                          onCancelDebt={() => void handleCancelDebt(d)}
                        />
                      </TableCell>
                    </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <CreatePayableDebtDialog
        open={debtDialogOpen}
        saving={saving}
        onClose={() => setDebtDialogOpen(false)}
        onSubmit={handleCreateDebt}
      />

      <SendPayableDebtDialog
        open={sendDialogOpen}
        debt={debtToSend}
        onClose={() => {
          setSendDialogOpen(false)
          setDebtToSend(null)
        }}
        onSent={() => load()}
      />

      <RecordPayableDebtPaymentDialog
        open={paymentDialog != null}
        debt={paymentDialog}
        onClose={() => setPaymentDialog(null)}
        onRecorded={async (updated, amount) => {
          toast.success(
            updated.status === 'PAID' ? 'Dette soldée' : 'Remboursement enregistré',
          )
          setPaymentDialog(null)
          setDebtAfterPayment(updated)
          setLastPaymentAmount(amount)
          setPaymentNoticeOpen(true)
          await load()
        }}
      />

      <SendPayableDebtPaymentNoticeDialog
        open={paymentNoticeOpen}
        debt={debtAfterPayment}
        paymentAmount={lastPaymentAmount}
        onClose={() => {
          setPaymentNoticeOpen(false)
          setDebtAfterPayment(null)
          setLastPaymentAmount(0)
        }}
        onSent={() => load()}
      />
    </Box>
  )
}
