import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { ArrowBack, Cancel, ContentCopy, Email, Payments } from '@mui/icons-material'
import { useToast } from '../../components/useToast'
import { TablePageSkeleton } from '../../components/loading/TablePageSkeleton'
import { formatCurrency, formatDate } from '../../utils/formatters'
import {
  payablesService,
  type PayableDebtDetail,
  type PayableDebtPayment,
  type PayableDebtRow,
} from '../../services/payables'
import { resolvePayableDebtDisplayStatus } from './payableDebtDisplayStatus'
import { formatEmailEngagementAt } from '../documents/documentEmailEngagement'
import { useRealtimePanelHighlight } from '../../hooks/useRealtimeRowHighlight'
import { getRealtimePanelSx } from '../../utils/realtimeRowHighlight'
import { usePageTitle } from '../../hooks/usePageTitle'
import { PayableDebtLegalNotice } from './components/PayableDebtLegalNotice'
import { SendPayableDebtDialog } from './components/SendPayableDebtDialog'
import { SendPayableDebtPaymentNoticeDialog } from './components/SendPayableDebtPaymentNoticeDialog'
import { RecordPayableDebtPaymentDialog } from './components/RecordPayableDebtPaymentDialog'
import {
  canCancelPayableDebt,
  canRecordPayablePayment,
} from './payableDebtPaymentValidation'

export function PayableDebtDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const debtId = id ? Number(id) : NaN

  const [debt, setDebt] = useState<PayableDebtDetail | null>(null)
  const [payments, setPayments] = useState<PayableDebtPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentNoticeOpen, setPaymentNoticeOpen] = useState(false)
  const [debtForPaymentNotice, setDebtForPaymentNotice] = useState<PayableDebtRow | null>(null)
  const [lastPaymentAmount, setLastPaymentAmount] = useState(0)

  const panelHighlight = useRealtimePanelHighlight('payables', id)
  const initialLoadDone = useRef(false)

  const loadDebt = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!Number.isFinite(debtId)) return
      if (!opts?.silent) setLoading(true)
      setError(null)
      try {
        const data = await payablesService.getDebt(debtId)
        setDebt(data)
        setPayments(data.payments ?? [])
        if (!opts?.silent) setLoading(false)
        initialLoadDone.current = true
      } catch (err: unknown) {
        setDebt(null)
        setError(err instanceof Error ? err.message : 'Dette introuvable')
        if (!opts?.silent) setLoading(false)
        initialLoadDone.current = true
      }
    },
    [debtId],
  )

  useEffect(() => {
    if (!Number.isFinite(debtId)) return
    initialLoadDone.current = false
    void loadDebt()
  }, [debtId, loadDebt])

  usePageTitle(
    loading
      ? 'Chargement de la dette…'
      : debt
        ? `Dette — ${debt.label}`
        : error
          ? 'Dette introuvable'
          : null,
  )

  useEffect(() => {
    if (!id) return
    const onRealtime = (ev: Event) => {
      const detail = (ev as CustomEvent<{ id?: string | number }>).detail
      if (detail?.id != null && String(detail.id) === id) {
        void loadDebt({ silent: initialLoadDone.current })
      }
    }
    window.addEventListener('facturio:payables-realtime', onRealtime)
    return () => window.removeEventListener('facturio:payables-realtime', onRealtime)
  }, [id, loadDebt])

  const handleCopyPublicLink = async () => {
    if (!debt) return
    try {
      const res = debt.publicToken
        ? { url: `${window.location.origin}/dette/${debt.publicToken}` }
        : await payablesService.preparePublicLink(debt.id)
      try {
        await navigator.clipboard.writeText(res.url)
        toast.success('Lien copié')
        await loadDebt({ silent: true })
      } catch {
        window.prompt('Copiez ce lien :', res.url)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Impossible de générer le lien')
    }
  }

  const handleCancelDebt = async () => {
    if (!debt) return
    const ok = window.confirm(
      `Annuler la dette « ${debt.label} » ?\n\nAucune suppression : le dossier reste consultable avec le statut « Annulée ».`,
    )
    if (!ok) return
    setError(null)
    try {
      await payablesService.cancelDebt(debt.id)
      toast.success('Dette annulée')
      await loadDebt({ silent: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Annulation impossible')
    }
  }

  if (!Number.isFinite(debtId)) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Identifiant invalide</Alert>
      </Box>
    )
  }

  if (loading) {
    return (
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <TablePageSkeleton rows={5} />
      </Box>
    )
  }

  if (error || !debt) {
    return (
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/finance/dettes')} sx={{ mb: 2 }}>
          Retour aux dettes
        </Button>
        <Alert severity="error">{error || 'Dette introuvable'}</Alert>
      </Box>
    )
  }

  const display = resolvePayableDebtDisplayStatus(debt)
  const eng = debt.emailEngagement
  const statusTitle = eng?.sentAt
    ? [
        eng.sentAt && `Envoyé : ${formatEmailEngagementAt(eng.sentAt)}`,
        eng.openedAt && `Ouvert : ${formatEmailEngagementAt(eng.openedAt)}`,
        eng.clickedAt && `Cliqué : ${formatEmailEngagementAt(eng.clickedAt)}`,
      ]
        .filter(Boolean)
        .join('\n')
    : undefined
  const canPay = debt.balance > 0.01 && debt.status !== 'CANCELLED'

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton onClick={() => navigate('/finance/dettes')} aria-label="Retour">
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 700, flex: 1 }}>
          {debt.label}
        </Typography>
        <Chip size="small" label={display.label} color={display.color} title={statusTitle} />
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, ...getRealtimePanelSx(panelHighlight) }}>
        {(debt.status === 'PAID' || debt.status === 'CANCELLED') && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {debt.status === 'PAID'
              ? 'Dette soldée : les remboursements sont conservés. Aucune suppression possible.'
              : 'Dette annulée : le dossier reste en historique à titre de trace.'}
          </Alert>
        )}
        <Typography variant="subtitle2" color="text.secondary">
          Créancier
        </Typography>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {debt.creditorName}
          {debt.creditorEmail ? (
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              ({debt.creditorEmail})
            </Typography>
          ) : null}
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 3 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Montant initial
            </Typography>
            <Typography variant="h6">{formatCurrency(debt.totalAmount)}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Déjà payé
            </Typography>
            <Typography variant="h6">{formatCurrency(debt.totalPaid)}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Reste
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {formatCurrency(debt.balance)}
            </Typography>
          </Box>
        </Stack>

        {debt.dueDate && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Échéance indicative : {formatDate(debt.dueDate)}
          </Typography>
        )}

        {debt.notes?.trim() && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Notes
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
              {debt.notes}
            </Typography>
          </>
        )}

        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 3 }}>
          <Button variant="outlined" startIcon={<Email />} onClick={() => setSendDialogOpen(true)}>
            Envoyer par email
          </Button>
          {canPay && (
            <Button variant="contained" startIcon={<Payments />} onClick={() => setPaymentDialogOpen(true)}>
              Enregistrer un paiement
            </Button>
          )}
          {canCancel && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<Cancel />}
              onClick={() => void handleCancelDebt()}
            >
              Annuler la dette
            </Button>
          )}
          <Button variant="text" startIcon={<ContentCopy />} onClick={() => void handleCopyPublicLink()}>
            Copier le lien public
          </Button>
        </Stack>

        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Remboursements
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Mode</TableCell>
                <TableCell align="right">Montant</TableCell>
                <TableCell>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    Aucun remboursement enregistré
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatDate(p.date)}</TableCell>
                    <TableCell>{p.method || '—'}</TableCell>
                    <TableCell align="right">{formatCurrency(p.amount)}</TableCell>
                    <TableCell>{p.notes || '—'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          Créée le {formatDate(debt.createdAt)}
        </Typography>

        <Box sx={{ mt: 3 }}>
          <PayableDebtLegalNotice variant="full" showDisclaimer={false} />
        </Box>
      </Paper>

      <RecordPayableDebtPaymentDialog
        open={paymentDialogOpen}
        debt={debt}
        onClose={() => setPaymentDialogOpen(false)}
        onRecorded={async (updated, amount) => {
          toast.success(
            updated.status === 'PAID' ? 'Dette soldée' : 'Remboursement enregistré',
          )
          setPaymentDialogOpen(false)
          setDebtForPaymentNotice(updated)
          setLastPaymentAmount(amount)
          setPaymentNoticeOpen(true)
          await loadDebt({ silent: true })
        }}
      />

      <SendPayableDebtPaymentNoticeDialog
        open={paymentNoticeOpen}
        debt={debtForPaymentNotice}
        paymentAmount={lastPaymentAmount}
        onClose={() => {
          setPaymentNoticeOpen(false)
          setDebtForPaymentNotice(null)
          setLastPaymentAmount(0)
        }}
        onSent={() => loadDebt({ silent: true })}
      />

      <SendPayableDebtDialog
        open={sendDialogOpen}
        debt={debt}
        onClose={() => setSendDialogOpen(false)}
        onSent={() => loadDebt({ silent: true })}
      />
    </Box>
  )
}
