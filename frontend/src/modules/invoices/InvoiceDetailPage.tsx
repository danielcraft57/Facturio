import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Alert,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useTheme,
  useMediaQuery,
  GridLegacy,
} from '@mui/material'
import {
  ArrowBack,
  Download,
  Send,
  Edit,
  Payment,
  Print,
  Email,
  MarkEmailRead,
  Cancel,
  Receipt,
  NotificationsActive,
  Unarchive,
  MoneyOff,
} from '@mui/icons-material'
import { invoiceService, normalizeInvoiceFromApi, unwrapApiPayload, type Invoice } from '../../services/invoices'
import { wasInvoiceEmailed } from './invoiceEmailUi'
import { resolveInvoiceDisplayStatus } from './invoiceDisplayStatus'
import { useToast } from '../../components/useToast'
import { logActivity } from '../../utils/activity'
import { apiClient } from '../../services/api'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { CreateCreditNoteDialog } from './components/CreateCreditNoteDialog'
import { RefundPaymentDialog } from './components/RefundPaymentDialog'
import { CancelDepositDialog } from './components/CancelDepositDialog'
import { refundsService, type Refund } from '../../services/refunds'
import { SendInvoiceDialog, type SendInvoicePayload } from './components/SendInvoiceDialog'
import { TablePageSkeleton } from '../../components/loading/TablePageSkeleton'
import { EInvoicingReadinessPanel } from '../e-invoicing/EInvoicingReadinessPanel'
import { useRealtimePanelHighlight } from '../../hooks/useRealtimeRowHighlight'
import { getRealtimePanelSx } from '../../utils/realtimeRowHighlight'
import { isDocumentFolder } from '../../types/documentFolders'
import { usePageTitle } from '../../hooks/usePageTitle'
import { InvoiceInstallmentsPanel } from './components/InvoiceInstallmentsPanel'
import { InvoiceInstallmentScheduleDialog } from './components/InvoiceInstallmentScheduleDialog'
import {
  invoiceInstallmentsService,
  type InvoiceInstallment,
} from '../../services/invoiceInstallments'

interface Payment {
  id: number
  amount: number
  date: string
  method?: string
  notes?: string
  refundedAmount?: number
  refundableAmount?: number
}

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentNotes, setPaymentNotes] = useState('')
  const [creditNoteDialogOpen, setCreditNoteDialogOpen] = useState(false)
  const [creditNoteMode, setCreditNoteMode] = useState<'linked' | 'credit'>('linked')
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [refundDialog, setRefundDialog] = useState<Payment | null>(null)
  const [cancelDepositOpen, setCancelDepositOpen] = useState(false)
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [installments, setInstallments] = useState<InvoiceInstallment[]>([])
  const [installmentDialogOpen, setInstallmentDialogOpen] = useState(false)
  const [installmentReminding, setInstallmentReminding] = useState(false)
  const toast = useToast()
  const panelHighlight = useRealtimePanelHighlight('invoices', id)
  const initialLoadDone = useRef(false)

  const loadPayments = useCallback(async (invoiceTotal: number) => {
    if (!id) return
    try {
      const response = await apiClient.get<Payment[]>(`/factures/${id}/payments`)
      const payload = unwrapApiPayload<Payment[]>(response)
      const paymentsList = Array.isArray(payload) ? payload : []
      setPayments(paymentsList)
      const refundsList = await refundsService.listByInvoice(id)
      setRefunds(refundsList)
      const totalPaid = paymentsList.reduce((sum, p) => sum + p.amount, 0)
      const totalRefunded = refundsList.reduce((sum, r) => sum + r.amount, 0)
      setPaymentAmount(Math.max(0, invoiceTotal - (totalPaid - totalRefunded)))
    } catch (err) {
      console.error('Erreur lors du chargement des paiements:', err)
    }
  }, [id])

  const loadInvoice = useCallback(async (opts?: { silent?: boolean }) => {
    if (!id) return
    if (!opts?.silent) setLoading(true)
    setError(null)
    try {
      const data = await invoiceService.getInvoice(id)
      setInvoice(data)
      setInstallments(data.installments ?? [])
      if (!opts?.silent) setLoading(false)
      initialLoadDone.current = true
      void loadPayments(data.total)
      if (!data.seenAt) {
        void invoiceService.updateDocumentFlags(data.id, { markSeen: true }).catch(() => {})
      }
    } catch (err: unknown) {
      setInvoice(null)
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement de la facture')
      console.error('Invoice error:', err)
      if (!opts?.silent) setLoading(false)
      initialLoadDone.current = true
    }
  }, [id, loadPayments])

  useEffect(() => {
    if (!id) return
    initialLoadDone.current = false
    void loadInvoice()
  }, [id, loadInvoice])

  usePageTitle(
    loading
      ? 'Chargement de la facture…'
      : invoice
        ? `Facture ${invoice.number}`
        : error
          ? 'Facture introuvable'
          : null,
  )

  useEffect(() => {
    if (!id) return
    const onRealtime = (ev: Event) => {
      const detail = (ev as CustomEvent<{ id?: string | number }>).detail
      if (detail?.id != null && String(detail.id) === id) {
        void loadInvoice({ silent: initialLoadDone.current })
      }
    }
    window.addEventListener('facturio:invoice-realtime', onRealtime)
    return () => window.removeEventListener('facturio:invoice-realtime', onRealtime)
  }, [id, loadInvoice])

  const handleDownloadPDF = async () => {
    if (!id) return
    
    try {
      setPdfLoading(true)
      const blob = await invoiceService.generatePDF(id)
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `facture-${invoice?.number || id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la génération du PDF')
    } finally {
      setPdfLoading(false)
    }
  }

  const handleSendEmail = async (payload: SendInvoicePayload) => {
    if (!id || !invoice) return
    try {
      setSendingEmail(true)
      await invoiceService.sendInvoice(id, {
        to: payload.to,
        updateClientEmail: payload.updateClientEmail,
      })
      toast.success(`Facture envoyée à ${payload.to}`)
      logActivity({
        type: 'success',
        title: 'Facture envoyée',
        message: `${invoice.number} → ${payload.to}`,
        category: 'invoice',
        href: `/factures/${id}`,
      })
      setSendDialogOpen(false)
      await loadInvoice({ silent: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi")
    } finally {
      setSendingEmail(false)
    }
  }

  const handleSendReminder = async () => {
    if (!id || !invoice) return
    if (!window.confirm(`Envoyer une relance pour ${invoice.number} ?`)) return
    try {
      const res = await invoiceService.sendReminder(id)
      const days = res.data?.daysOverdue
      toast.success(days ? `Relance envoyée (${days} j. de retard)` : 'Relance envoyée')
      logActivity({
        type: 'info',
        title: 'Relance envoyée',
        message: invoice.number,
        category: 'invoice',
        href: `/factures/${id}`,
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la relance')
    }
  }

  const handleMarkAsPaid = async () => {
    if (!id || !invoice) return
    
    if (paymentAmount <= 0) {
      setError('Le montant doit être supérieur à 0')
      return
    }
    
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
    if (paymentAmount > (invoice.total - totalPaid)) {
      setError('Le montant ne peut pas dépasser le reste à payer')
      return
    }
    
    try {
      await apiClient.post(`/invoices/${id}/payments`, {
        amount: paymentAmount,
        method: paymentMethod,
        date: paymentDate,
        notes: paymentNotes
      })
      setPaymentDialogOpen(false)
      setPaymentNotes('')
      await loadInvoice({ silent: true })
      // Réinitialiser le montant pour le prochain paiement après rechargement
      setTimeout(() => {
        if (invoice) {
          const newTotalPaid = totalPaid + paymentAmount
          setPaymentAmount(Math.max(0, invoice.total - newTotalPaid))
        }
      }, 100)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement du paiement')
    }
  }

  if (isDocumentFolder(id)) {
    return <Navigate to={`/factures/${id}`} replace />
  }

  if (loading) {
    return (
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <TablePageSkeleton rows={5} />
      </Box>
    )
  }

  if (error || !invoice) {
    return (
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/factures/inbox')}
          sx={{ mb: 2 }}
        >
          Retour aux factures
        </Button>
        <Alert severity="error">
          {error || 'Facture introuvable'}
        </Alert>
      </Box>
    )
  }

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  const totalRefunded = refunds.reduce((sum, r) => sum + r.amount, 0)
  const netPaid = totalPaid - totalRefunded
  const appliedCredit = invoice.appliedCreditTotal ?? 0
  const remainingAmount = Math.max(
    0,
    invoice.balance ??
      Number((invoice.total - netPaid - appliedCredit).toFixed(2)),
  )
  const isFullySettled = remainingAmount <= 0.01
  const settledByCreditOnly = isFullySettled && netPaid < 0.01 && appliedCredit > 0.01
  const settlementLabel =
    invoice.settlement === 'SOLDEE_AVOIR'
      ? 'Soldée (avoir)'
      : invoice.settlement === 'SOLDEE_MIXTE'
        ? 'Soldée (avoir + paiement)'
        : invoice.settlement === 'SOLDEE_CB'
          ? 'Payée'
          : resolveInvoiceDisplayStatus(invoice).label
  const isArchived = Boolean(invoice.archivedAt)
  const isCancelled = invoice.status === 'cancelled'
  const isDepositInvoice = invoice.tags?.includes('ACOMPTE_10')
  const depositRefunded = invoice.tags?.includes('ACOMPTE_REFUNDED')
  const canCancelDeposit =
    isDepositInvoice &&
    !isCancelled &&
    !depositRefunded &&
    payments.some((p) => (p.refundableAmount ?? p.amount) > 0.01)
  const hasStripePayments = payments.some((p) => p.notes?.startsWith('stripe:'))
  const canEditInstallments =
    !isCancelled && payments.length === 0 && !installments.some((i) => i.status === 'PAID')
  const nextInstallment = installments.find((i) => i.status === 'PENDING') ?? null

  const handleRestore = async () => {
    if (!id) return
    try {
      await invoiceService.restoreInvoice(id)
      apiClient.invalidateCache('/invoices')
      toast.success('Facture restaurée')
      await loadInvoice()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Restauration impossible')
    }
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {isArchived && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" startIcon={<Unarchive />} onClick={handleRestore}>
              Restaurer
            </Button>
          }
        >
          Cette facture est archivée. Elle n&apos;apparaît plus dans la liste active.
        </Alert>
      )}
      {/* En-tête avec actions */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/factures/inbox')}
        >
          Retour
        </Button>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {invoice.status === 'draft' && (
            <>
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={() => navigate(`/factures/${id}/edit`)}
              >
                Modifier
              </Button>
              <Button
                variant="contained"
                startIcon={<Send />}
                onClick={() => setSendDialogOpen(true)}
              >
                Envoyer
              </Button>
            </>
          )}
          
          {(invoice.status === 'sent' || invoice.status === 'overdue') && (
            <>
              <Button
                variant="contained"
                startIcon={<Payment />}
                onClick={() => setPaymentDialogOpen(true)}
                color="success"
              >
                Enregistrer paiement
              </Button>
              <Button
                variant="contained"
                color="warning"
                startIcon={<NotificationsActive />}
                onClick={handleSendReminder}
              >
                Relancer
              </Button>
            </>
          )}
          
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
          >
            {pdfLoading ? 'Génération...' : 'PDF'}
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={() => window.print()}
          >
            Imprimer
          </Button>
          
          <Button
            variant="outlined"
            color={wasInvoiceEmailed(invoice) ? 'success' : 'inherit'}
            startIcon={wasInvoiceEmailed(invoice) ? <MarkEmailRead /> : <Email />}
            onClick={() => setSendDialogOpen(true)}
          >
            {wasInvoiceEmailed(invoice) ? 'Renvoyer' : 'Email'}
          </Button>
        </Stack>
      </Stack>

      {/^\d+$/.test(id ?? '') ? <EInvoicingReadinessPanel invoiceId={Number(id)} /> : null}

      {(invoice.tags?.includes('ACOMPTE_10') || invoice.tags?.includes('SOLDE_APRES_ACOMPTE')) && (
        <Alert
          severity={depositRefunded ? 'success' : invoice.tags?.includes('ACOMPTE_10') ? 'warning' : 'info'}
          sx={{ mb: 2, borderRadius: 2 }}
        >
          <Typography fontWeight={700} sx={{ mb: 0.5 }}>
            {depositRefunded
              ? 'Acompte remboursé — contrat annulé'
              : invoice.tags?.includes('ACOMPTE_10')
                ? "Facture d'acompte — paiement acompte (10 %)"
                : 'Facture de solde'}
          </Typography>
          {invoice.notes && (
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {invoice.notes}
            </Typography>
          )}
        </Alert>
      )}

      {/* Informations principales */}
      <GridLegacy container spacing={3} sx={{ mb: 3 }}>
        <GridLegacy item xs={12} md={8}>
          <Card sx={getRealtimePanelSx(panelHighlight)}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
                <Box>
                  <Typography variant="h4" gutterBottom>
                    {invoice.number}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Date d'émission: {formatDate(invoice.issueDate)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Échéance: {formatDate(invoice.dueDate)}
                  </Typography>
                </Box>
                <Stack alignItems="flex-end" spacing={1}>
                  {(() => {
                    const display = resolveInvoiceDisplayStatus(invoice)
                    return (
                      <Chip label={display.label} color={display.color} size="medium" />
                    )
                  })()}
                </Stack>
              </Stack>

              <Divider sx={{ my: 3 }} />

              {/* Informations client */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Facturé à
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {invoice.client.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {invoice.client.email}
                </Typography>
              </Box>

              {/* Lignes de facture */}
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Articles
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Quantité</TableCell>
                      <TableCell align="right">Prix unitaire</TableCell>
                      <TableCell align="right">TVA</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoice.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell align="right">{item.taxRate}%</TableCell>
                        <TableCell align="right">{formatCurrency(item.totalWithTax)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Totaux */}
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Box sx={{ minWidth: 250 }}>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>Sous-total:</Typography>
                      <Typography>{formatCurrency(invoice.subtotal)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>TVA:</Typography>
                      <Typography>{formatCurrency(invoice.taxTotal)}</Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6">Total TTC:</Typography>
                      <Typography variant="h6">{formatCurrency(invoice.total)}</Typography>
                    </Box>
                    {appliedCredit > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'info.main' }}>
                        <Typography>Avoir imputé:</Typography>
                        <Typography fontWeight="medium">−{formatCurrency(appliedCredit)}</Typography>
                      </Box>
                    )}
                    {netPaid > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'success.main' }}>
                        <Typography>Encaissé:</Typography>
                        <Typography fontWeight="medium">−{formatCurrency(netPaid)}</Typography>
                      </Box>
                    )}
                    {remainingAmount > 0.01 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'error.main' }}>
                        <Typography>Reste à payer:</Typography>
                        <Typography fontWeight="medium">{formatCurrency(remainingAmount)}</Typography>
                      </Box>
                    )}
                    {isFullySettled && settledByCreditOnly && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'success.main' }}>
                        <Typography>Net à payer:</Typography>
                        <Typography fontWeight="medium">{formatCurrency(0)}</Typography>
                      </Box>
                    )}
                  </Stack>
                </Box>
              </Box>

              {!isCancelled && (
                <InvoiceInstallmentsPanel
                  installments={installments}
                  saleAccounting={invoice.installmentSaleAccounting}
                  canEdit={canEditInstallments}
                  onConfigure={() => setInstallmentDialogOpen(true)}
                  canRemind={Boolean(invoice.sentAt && nextInstallment && !isFullySettled)}
                  reminding={installmentReminding}
                  onRemind={async (installmentId) => {
                    if (!id) return
                    setInstallmentReminding(true)
                    try {
                      await invoiceInstallmentsService.remind(id, installmentId)
                      toast.success('Relance échéance envoyée')
                    } catch (err: unknown) {
                      toast.error(
                        err instanceof Error ? err.message : 'Envoi de la relance impossible',
                      )
                    } finally {
                      setInstallmentReminding(false)
                    }
                  }}
                />
              )}

              {/* Historique des paiements */}
              {payments.length > 0 && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="h6" gutterBottom>
                    Historique des paiements
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Méthode</TableCell>
                          <TableCell align="right">Montant</TableCell>
                          <TableCell>Notes</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {payments.map((payment) => {
                          const refundable = payment.refundableAmount ?? payment.amount
                          return (
                          <TableRow key={payment.id}>
                            <TableCell>{formatDate(payment.date)}</TableCell>
                            <TableCell>
                              {payment.method === 'STRIPE' ? 'Stripe' :
                               payment.method === 'bank_transfer' ? 'Virement' :
                               payment.method === 'check' ? 'Chèque' :
                               payment.method === 'cash' ? 'Espèces' :
                               payment.method === 'card' ? 'Carte' :
                               payment.method || 'Autre'}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(payment.amount)}
                              {(payment.refundedAmount ?? 0) > 0 && (
                                <Typography variant="caption" display="block" color="text.secondary">
                                  Remb. {formatCurrency(payment.refundedAmount!)}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>{payment.notes || '-'}</TableCell>
                            <TableCell align="right">
                              {refundable > 0.01 && !depositRefunded && !isCancelled && (
                                <Button
                                  size="small"
                                  color="warning"
                                  startIcon={<MoneyOff />}
                                  onClick={() => setRefundDialog(payment)}
                                >
                                  Rembourser
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" fontWeight="medium">
                      Net encaissé:
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {formatCurrency(netPaid)}
                    </Typography>
                  </Box>
                </>
              )}

              {refunds.length > 0 && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="h6" gutterBottom>
                    Remboursements
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell align="right">Montant</TableCell>
                          <TableCell>Motif</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {refunds.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell>{formatDate(r.date)}</TableCell>
                            <TableCell align="right">{formatCurrency(r.amount)}</TableCell>
                            <TableCell>{r.reason || r.notes || '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}

              {/* Notes et conditions */}
              {(invoice.notes || invoice.terms) && (
                <>
                  <Divider sx={{ my: 3 }} />
                  {invoice.notes && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Notes
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {invoice.notes}
                      </Typography>
                    </Box>
                  )}
                  {invoice.terms && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Conditions de paiement
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {invoice.terms}
                      </Typography>
                    </Box>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </GridLegacy>

        {/* Panneau latéral */}
        <GridLegacy item xs={12} md={4}>
          <Stack spacing={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Informations
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Statut
                    </Typography>
                    <Typography variant="body1">
                      {settlementLabel}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Montant total
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(invoice.total)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Total payé
                    </Typography>
                    <Typography variant="body1" color="success.main">
                      {formatCurrency(totalPaid)}
                    </Typography>
                  </Box>
                  {(invoice.appliedCreditTotal ?? 0) > 0 && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Avoir imputé
                      </Typography>
                      <Typography variant="body1" color="info.main" fontWeight="medium">
                        -{formatCurrency(invoice.appliedCreditTotal ?? 0)}
                      </Typography>
                    </Box>
                  )}
                  {remainingAmount > 0.01 && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Reste à payer
                      </Typography>
                      <Typography variant="body1" color="warning.main" fontWeight="medium">
                        {formatCurrency(remainingAmount)}
                      </Typography>
                    </Box>
                  )}
                  {isFullySettled && settledByCreditOnly && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Règlement
                      </Typography>
                      <Typography variant="body1" color="success.main" fontWeight="medium">
                        Soldée par avoir (aucun encaissement)
                      </Typography>
                    </Box>
                  )}
                  {remainingAmount <= 0.01 && payments.length > 0 && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Payée le
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(payments[payments.length - 1].date)}
                      </Typography>
                    </Box>
                  )}
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Créée le
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(invoice.createdAt)}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Actions rapides
                </Typography>
                <Stack spacing={1}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={handleDownloadPDF}
                    disabled={pdfLoading}
                  >
                    Télécharger PDF
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Email />}
                    onClick={() => setSendDialogOpen(true)}
                  >
                    Envoyer par email
                  </Button>
                  {(invoice.status === 'sent' || (invoice.status === 'paid' && remainingAmount > 0)) && (
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<Payment />}
                      onClick={() => {
                        setPaymentAmount(
                          Math.min(
                            nextInstallment?.amount ?? remainingAmount,
                            remainingAmount,
                          ),
                        )
                        setPaymentDialogOpen(true)
                      }}
                      color="success"
                    >
                      {remainingAmount > 0 ? 'Ajouter paiement' : 'Enregistrer paiement'}
                    </Button>
                  )}
                  {payments.length > 0 && !depositRefunded && !isCancelled && (
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Receipt />}
                      onClick={() => {
                        setCreditNoteMode('linked')
                        setCreditNoteDialogOpen(true)
                      }}
                    >
                      Créer un avoir
                    </Button>
                  )}
                  {!depositRefunded && !isCancelled && (
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Receipt />}
                      onClick={() => {
                        setCreditNoteMode('credit')
                        setCreditNoteDialogOpen(true)
                      }}
                    >
                      Créer un crédit client
                    </Button>
                  )}
                  {canCancelDeposit && (
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      startIcon={<MoneyOff />}
                      onClick={() => setCancelDepositOpen(true)}
                    >
                      Annuler acompte & rembourser
                    </Button>
                  )}
                  {invoice.status === 'draft' && (
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Cancel />}
                      onClick={async () => {
                        if (confirm('Êtes-vous sûr de vouloir annuler cette facture ?')) {
                          try {
                            await invoiceService.cancelInvoice(invoice.id)
                            await loadInvoice()
                          } catch (err: any) {
                            setError(err.message)
                          }
                        }
                      }}
                      color="error"
                    >
                      Annuler
                    </Button>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </GridLegacy>
      </GridLegacy>

      {/* Dialog de paiement */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Enregistrer un paiement</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Reste à payer: {formatCurrency(remainingAmount)}
            </Alert>
            <TextField
              fullWidth
              label="Montant"
              type="number"
              value={paymentAmount}
              onChange={(e) => {
                const amount = Number(e.target.value)
                setPaymentAmount(Math.min(Math.max(0, amount), remainingAmount))
              }}
              InputProps={{
                inputProps: { min: 0, max: remainingAmount, step: 0.01 }
              }}
              helperText={`Maximum: ${formatCurrency(remainingAmount)}`}
            />
            <TextField
              fullWidth
              select
              label="Méthode de paiement"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              SelectProps={{
                native: true
              }}
            >
              <option value="bank_transfer">Virement bancaire</option>
              <option value="check">Chèque</option>
              <option value="cash">Espèces</option>
              <option value="card">Carte bancaire</option>
              <option value="other">Autre</option>
            </TextField>
            <TextField
              fullWidth
              label="Date de paiement"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Notes (optionnel)"
              multiline
              rows={2}
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="Référence, numéro de chèque, etc."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setPaymentDialogOpen(false)
            setPaymentNotes('')
          }}>
            Annuler
          </Button>
          <Button 
            variant="contained" 
            onClick={handleMarkAsPaid}
            disabled={paymentAmount <= 0 || paymentAmount > remainingAmount}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog création avoir */}
      {invoice && (
        <CreateCreditNoteDialog
          open={creditNoteDialogOpen}
          onClose={() => setCreditNoteDialogOpen(false)}
          invoice={invoice}
          onSubmit={async (items) => {
            try {
              const res =
                creditNoteMode === 'credit'
                  ? await invoiceService.createClientCreditNote(invoice, items)
                  : await invoiceService.createCreditNote(invoice, items)
              await loadInvoice({ silent: true })
              toast.success(
                creditNoteMode === 'credit'
                  ? `Crédit client ${res.data?.number ?? ''} créé`
                  : `Avoir ${res.data?.number ?? ''} créé`,
              )
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Erreur lors de la création de l\'avoir'
              setError(msg)
              toast.error(msg)
              throw err
            }
          }}
        />
      )}

      {refundDialog && (
        <RefundPaymentDialog
          open
          onClose={() => setRefundDialog(null)}
          paymentId={refundDialog.id}
          maxAmount={refundDialog.refundableAmount ?? refundDialog.amount}
          isStripe={refundDialog.notes?.startsWith('stripe:')}
          onSubmit={async (payload) => {
            await refundsService.createOnPayment(refundDialog.id, {
              ...payload,
              paymentId: refundDialog.id,
            })
            toast.success('Remboursement enregistré')
            await loadInvoice({ silent: true })
          }}
        />
      )}

      {invoice && (
        <CancelDepositDialog
          open={cancelDepositOpen}
          onClose={() => setCancelDepositOpen(false)}
          invoiceNumber={invoice.number}
          hasStripePayments={hasStripePayments}
          onSubmit={async (payload) => {
            const result = await refundsService.cancelDeposit(invoice.id, payload)
            toast.success(
              `Contrat annulé — avoir ${result.avoir.number}, ${result.refunds.length} remboursement(s)`,
            )
            await loadInvoice({ silent: true })
          }}
        />
      )}

      <SendInvoiceDialog
        open={sendDialogOpen}
        invoice={invoice}
        onClose={() => !sendingEmail && setSendDialogOpen(false)}
        onSend={handleSendEmail}
        sending={sendingEmail}
      />

      {invoice && (
        <InvoiceInstallmentScheduleDialog
          open={installmentDialogOpen}
          onClose={() => setInstallmentDialogOpen(false)}
          invoiceId={invoice.id}
          invoiceTotal={invoice.total}
          existing={installments}
          canEdit={canEditInstallments}
          onSaved={() => {
            void loadInvoice({ silent: true })
            toast.success('Échéancier mis à jour')
          }}
        />
      )}
    </Box>
  )
}

