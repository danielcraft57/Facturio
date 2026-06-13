import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
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
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

type StripeJsPromise = ReturnType<typeof loadStripe>
import { ApiClient } from '../../../services/apiClient'
import { formatCurrency, formatDate } from '../../../utils/formatters'
import { PublicDataProcessingNotice } from '../../legal/PublicDataProcessingNotice'
import { InvoicePublicSkeleton } from '../../../components/loading/InvoicePublicSkeleton'
import { resolveApiBaseUrl } from '../../../utils/resolveApiBaseUrl'

const api = ApiClient.getInstance()
const API_BASE = resolveApiBaseUrl()

export interface PublicInvoiceSummary {
  number: string
  date: string
  dueDate?: string | null
  status: string
  currency: string
  subtotal: number
  tax: number
  total: number
  balance: number
  totalPaid: number
  appliedCreditTotal?: number
  canPayOnline: boolean
  stripeEnabled: boolean
  stripePublishableKey?: string | null
  issuerName: string
  privacyPolicyUrl?: string | null
  dataControllerEmail?: string | null
  client: { name: string }
  lines: { description: string; quantity: number; unitPrice: number; total: number }[]
  documentKind?: 'standard' | 'deposit' | 'remainder'
  titleLabel?: string
  commitmentParagraph?: string | null
  tags?: string[]
  engagementBreakdown?: {
    contractTotal: number
    depositAmount: number
    remainderAmount: number
  } | null
  installments?: {
    id: number
    sequence: number
    amount: number
    dueDate: string
    status: string
    overdue: boolean
    label?: string | null
  }[]
  nextInstallment?: {
    id: number
    sequence: number
    amount: number
    dueDate: string
    status: string
    overdue: boolean
    label?: string | null
  } | null
}

function StripeCheckoutForm({
  token,
  amount,
  currency,
  submitLabel,
  onSuccess,
  onError,
}: {
  token: string
  amount: number
  currency: string
  submitLabel?: string
  onSuccess: () => void
  onError: (message: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [elementsReady, setElementsReady] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!stripe || !elements || !elementsReady) return

    setSubmitting(true)
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    })
    setSubmitting(false)

    if (error) {
      onError(error.message || 'Le paiement a échoué')
      return
    }
    if (paymentIntent?.status === 'succeeded') {
      await api.post(`public/invoices/${token}/confirm-payment`, {
        paymentIntentId: paymentIntent.id,
      })
      onSuccess()
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <PaymentElement onReady={() => setElementsReady(true)} />
      <Button
        type="submit"
        variant="contained"
        color="success"
        size="large"
        fullWidth
        sx={{ mt: 3 }}
        disabled={!stripe || !elementsReady || submitting}
      >
        {submitting ? (
          <CircularProgress size={26} color="inherit" />
        ) : (
          submitLabel ?? `Payer ${formatCurrency(amount)}`
        )}
      </Button>
    </Box>
  )
}

function RecapRow({
  label,
  amount,
  hint,
  highlight,
  done,
}: {
  label: string
  amount?: string
  hint?: string
  highlight?: boolean
  done?: boolean
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 2,
        py: 1.25,
        px: highlight ? 1.5 : 0,
        borderRadius: highlight ? 1.5 : 0,
        bgcolor: highlight ? 'action.hover' : 'transparent',
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="body2"
          fontWeight={highlight ? 700 : 500}
          color={done ? 'success.main' : highlight ? 'text.primary' : 'text.secondary'}
        >
          {label}
        </Typography>
        {hint && (
          <Typography variant="caption" color="text.secondary" display="block">
            {hint}
          </Typography>
        )}
      </Box>
      {done ? (
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
          <CheckCircleOutlineIcon color="success" sx={{ fontSize: 18 }} />
          <Typography variant="body2" fontWeight={700} color="success.main">
            Réglé
          </Typography>
        </Stack>
      ) : (
        amount && (
          <Typography variant="body2" fontWeight={highlight ? 800 : 600} sx={{ flexShrink: 0 }}>
            {amount}
          </Typography>
        )
      )}
    </Box>
  )
}

function InvoicePaymentRecap({
  invoice,
  isPaid,
  isDeposit,
  checkoutAmount,
}: {
  invoice: PublicInvoiceSummary
  isPaid: boolean
  isDeposit: boolean
  checkoutAmount?: number | null
}) {
  const breakdown = invoice.engagementBreakdown
  const isRemainder = invoice.documentKind === 'remainder'
  const hasSplit = Boolean(breakdown)
  const nextInst = invoice.nextInstallment
  const instCount = invoice.installments?.length ?? 0

  const creditApplied = invoice.appliedCreditTotal ?? 0
  const settledByCreditOnly =
    isPaid && creditApplied > 0.01 && invoice.balance <= 0.01

  const amountDueNow =
    checkoutAmount ?? nextInst?.amount ?? (!isPaid ? invoice.balance : 0)

  if (!hasSplit && !isDeposit && !isRemainder) {
    if (isPaid) {
      return (
        <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }}>
          {settledByCreditOnly
            ? 'Cette facture est soldée par imputation d\'avoir. Aucun paiement supplémentaire n\'est attendu.'
            : 'Cette facture est réglée. Merci pour votre paiement.'}
        </Alert>
      )
    }
    return (
      <Paper variant="outlined" sx={{ p: 2, mb: 2.5, borderRadius: 2, bgcolor: 'grey.50' }}>
        <Typography variant="overline" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
          {nextInst && instCount > 0
            ? `Échéance ${nextInst.sequence}/${instCount} — à régler`
            : 'À régler'}
        </Typography>
        <Typography variant="h5" fontWeight={800}>
          {formatCurrency(amountDueNow)}
        </Typography>
        {nextInst && instCount > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Solde restant sur cette facture : {formatCurrency(invoice.balance)}
          </Typography>
        )}
        {invoice.dueDate && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Échéance le {formatDate(nextInst?.dueDate ?? invoice.dueDate)}
          </Typography>
        )}
      </Paper>
    )
  }

  const depositDone = isRemainder || (isDeposit && isPaid)
  const payingNow = !isPaid ? amountDueNow : 0

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2.5, borderRadius: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="subtitle2" fontWeight={700}>
          {hasSplit ? 'Récapitulatif du devis' : 'Récapitulatif'}
        </Typography>
        {isPaid ? (
          <Chip size="small" color="success" label="Facture réglée" />
        ) : (
          <Chip size="small" color="warning" variant="outlined" label="En attente de paiement" />
        )}
      </Stack>

      {breakdown && (
        <>
          <RecapRow label="Total du devis" amount={formatCurrency(breakdown.contractTotal)} />
          <Divider sx={{ my: 0.5 }} />
          <RecapRow
            label="Acompte (10 %)"
            amount={formatCurrency(breakdown.depositAmount)}
            hint={isDeposit && !isPaid ? 'Première étape — à payer maintenant' : undefined}
            highlight={isDeposit && !isPaid}
            done={Boolean(depositDone && (isPaid || isRemainder))}
          />
          <RecapRow
            label="Solde"
            amount={formatCurrency(breakdown.remainderAmount)}
            hint={
              isRemainder && !isPaid
                ? 'Deuxième étape — à payer maintenant'
                : isDeposit
                  ? 'Facturé après réalisation / livraison'
                  : undefined
            }
            highlight={isRemainder && !isPaid}
            done={isRemainder && isPaid}
          />
        </>
      )}

      {!isPaid && payingNow > 0 && (
        <>
          <Divider sx={{ my: 1.5 }} />
          <Box
            sx={{
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: 'action.hover',
              border: 1,
              borderColor: isDeposit ? 'warning.light' : 'primary.light',
            }}
          >
            <Typography variant="caption" color="text.secondary" display="block">
              {nextInst && instCount > 0
                ? `Échéance ${nextInst.sequence}/${instCount} — montant à régler`
                : 'Montant de cette facture'}
            </Typography>
            <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.2 }}>
              {formatCurrency(payingNow)}
            </Typography>
            {nextInst && instCount > 0 && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                Solde restant : {formatCurrency(invoice.balance)}
              </Typography>
            )}
          </Box>
        </>
      )}

      {isPaid && (
        <Alert severity="success" sx={{ mt: 1.5, borderRadius: 1.5 }} icon={<CheckCircleOutlineIcon />}>
          {isDeposit
            ? 'Acompte réglé. Le solde vous sera facturé séparément.'
            : 'Merci, cette facture est entièrement réglée.'}
        </Alert>
      )}

      {!isPaid && (isDeposit || isRemainder) && invoice.commitmentParagraph && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5 }}>
          {invoice.commitmentParagraph}
        </Typography>
      )}
    </Paper>
  )
}

/**
 * Page client : résumé de facture + paiement Stripe sur une seule page.
 * Accès externe via token unique (lien reçu par email).
 */
export function ClientInvoicePage() {
  const { token } = useParams<{ token: string }>()
  const [invoice, setInvoice] = useState<PublicInvoiceSummary | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stripePromise, setStripePromise] = useState<StripeJsPromise | null>(null)
  const [orgPublishableKey, setOrgPublishableKey] = useState<string | null>(null)
  const [bnplMethods, setBnplMethods] = useState<string[]>([])
  const [checkoutAmount, setCheckoutAmount] = useState<number | null>(null)
  const [checkoutInstallmentSequence, setCheckoutInstallmentSequence] = useState<number | null>(null)

  const loadCheckout = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      type CheckoutPayload = {
        invoice?: PublicInvoiceSummary
        payment?: {
          clientSecret: string
          stripePublishableKey?: string
          bnplMethods?: string[]
          amount?: number
          installmentSequence?: number | null
        }
        paymentError?: string | null
        error?: string
      }
      const res = await api.get<CheckoutPayload | { data?: CheckoutPayload }>(
        `public/invoices/${token}/checkout`,
      )
      const payload: CheckoutPayload | undefined =
        res && typeof res === 'object' && 'invoice' in res
          ? (res as CheckoutPayload)
          : res && typeof res === 'object' && 'data' in res
            ? (res as { data?: CheckoutPayload }).data
            : undefined
      if (!payload?.invoice) {
        setError('Facture introuvable ou lien expiré')
        return
      }
      setInvoice(payload.invoice)
      setClientSecret(payload.payment?.clientSecret ?? null)
      setBnplMethods(payload.payment?.bnplMethods ?? [])
      setCheckoutAmount(payload.payment?.amount ?? null)
      setCheckoutInstallmentSequence(payload.payment?.installmentSequence ?? null)
      setPaymentError(payload.paymentError ?? null)
      const pk =
        payload.payment?.stripePublishableKey ||
        payload.invoice.stripePublishableKey ||
        null
      setOrgPublishableKey(pk)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Impossible de charger la facture')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadCheckout()
  }, [loadCheckout])

  useEffect(() => {
    if (orgPublishableKey) {
      setStripePromise(loadStripe(orgPublishableKey))
    } else {
      setStripePromise(null)
    }
  }, [orgPublishableKey])

  const isPaid = useMemo(() => {
    if (!invoice) return false
    return invoice.balance <= 0 || invoice.status === 'PAID' || paymentSuccess
  }, [invoice, paymentSuccess])
  const isBelowStripeMinimum = useMemo(() => {
    if (!invoice) return false
    return invoice.balance > 0 && invoice.balance < 0.5
  }, [invoice])

  const stripeMissing = useMemo(() => {
    if (!invoice) return false
    // Si le solde > 0 mais que Stripe est non configuré, on explique pourquoi le paiement en ligne n'apparaît pas.
    return invoice.balance > 0 && !invoice.canPayOnline && !invoice.stripeEnabled
  }, [invoice])

  const showPayment = useMemo(() => {
    return (
      !isPaid &&
      !!invoice?.canPayOnline &&
      !!clientSecret &&
      !!stripePromise &&
      !isBelowStripeMinimum
    )
  }, [isPaid, invoice, clientSecret, stripePromise, isBelowStripeMinimum])

  const isDeposit = Boolean(
    invoice?.documentKind === 'deposit' || invoice?.tags?.includes('ACOMPTE_10'),
  )
  const isRemainder = Boolean(
    invoice?.documentKind === 'remainder' || invoice?.tags?.includes('SOLDE_APRES_ACOMPTE'),
  )
  const pageTitle = invoice?.titleLabel ?? (isDeposit ? "Facture d'acompte" : isRemainder ? 'Facture de solde' : 'Facture')
  const installmentHint = useMemo(() => {
    if (!invoice?.nextInstallment) return null
    const next = invoice.nextInstallment
    const seq = checkoutInstallmentSequence ?? next.sequence
    const amount = checkoutAmount ?? next.amount
    const kind = next.label ?? `Échéance ${seq}`
    return `${kind} : ${formatCurrency(amount)} (paiement en ${invoice.installments?.length ?? ''} fois)`
  }, [invoice, checkoutAmount, checkoutInstallmentSequence])

  const bnplHint = useMemo(() => {
    if (bnplMethods.length === 0) return null
    const labels = bnplMethods
      .map((m) => (m === 'klarna' ? 'Klarna' : m === 'alma' ? 'Alma' : m))
      .join(' ou ')
    return `Paiement en plusieurs fois disponible (${labels}) — réservé aux particuliers.`
  }, [bnplMethods])

  const paymentContextLabel = useMemo(() => {
    if (!invoice) return null
    if (installmentHint) return installmentHint
    if (isDeposit && invoice.engagementBreakdown) {
      return `Acompte de ${formatCurrency(invoice.balance)} sur ${formatCurrency(invoice.engagementBreakdown.contractTotal)}`
    }
    if (isRemainder && invoice.engagementBreakdown) {
      return `Solde restant du devis (${formatCurrency(invoice.engagementBreakdown.contractTotal)} au total)`
    }
    return null
  }, [invoice, isDeposit, isRemainder, installmentHint])

  if (loading) {
    return <InvoicePublicSkeleton />
  }

  if (error || !invoice) {
    return (
      <Container maxWidth="sm">
        <Alert severity="error">{error || 'Facture introuvable'}</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg">
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: showPayment ? 7 : 12 }}>
          <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, border: 1, borderColor: 'divider' }}>
            <Typography variant="overline" color="text.secondary">
              {invoice.issuerName || 'Facture'}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {pageTitle}
              </Typography>
              <Typography variant="h4" color="text.secondary" sx={{ fontWeight: 600 }}>
                {invoice.number}
              </Typography>
              {isDeposit && <Chip size="small" label="Étape 1 · Acompte" color="warning" variant="outlined" />}
              {isRemainder && <Chip size="small" label="Étape 2 · Solde" color="primary" variant="outlined" />}
            </Stack>
            <Typography color="text.secondary" sx={{ mb: 2.5 }}>
              {invoice.client.name} · Émise le {formatDate(invoice.date)}
              {invoice.dueDate ? ` · Échéance ${formatDate(invoice.dueDate)}` : ''}
            </Typography>

            <InvoicePaymentRecap
              invoice={invoice}
              isPaid={isPaid}
              isDeposit={isDeposit}
              checkoutAmount={checkoutAmount}
            />

            {(invoice.appliedCreditTotal ?? 0) > 0 && (
              <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                Avoir imputé sur cette facture : {formatCurrency(invoice.appliedCreditTotal ?? 0)}
              </Alert>
            )}

            {stripeMissing && (
              <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                <Typography fontWeight={800} sx={{ mb: 0.5 }}>
                  Règlement en ligne indisponible
                </Typography>
                <Typography variant="body2">
                  Le paiement par carte n’est pas proposé pour cette facture. Merci de régler selon les modalités
                  indiquées par votre prestataire (virement, chèque, etc.).
                </Typography>
              </Alert>
            )}

            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
              Détail de la facture
            </Typography>
            <TableContainer sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Qté</TableCell>
                    <TableCell align="right">Prix unit.</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoice.lines.map((line, index) => (
                    <TableRow key={`${line.description}-${index}`}>
                      <TableCell>{line.description}</TableCell>
                      <TableCell align="right">{line.quantity}</TableCell>
                      <TableCell align="right">{formatCurrency(line.unitPrice)}</TableCell>
                      <TableCell align="right">{formatCurrency(line.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Stack spacing={0.5} sx={{ mb: 2, maxWidth: 320, ml: 'auto' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">Sous-total HT</Typography>
                <Typography>{formatCurrency(invoice.subtotal)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">TVA</Typography>
                <Typography>{formatCurrency(invoice.tax)}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography fontWeight={700}>Total TTC</Typography>
                <Typography fontWeight={700}>{formatCurrency(invoice.total)}</Typography>
              </Box>
              {(invoice.appliedCreditTotal ?? 0) > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">Avoir imputé</Typography>
                  <Typography color="info.main">−{formatCurrency(invoice.appliedCreditTotal ?? 0)}</Typography>
                </Box>
              )}
              {invoice.totalPaid > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">Encaissé</Typography>
                  <Typography>−{formatCurrency(invoice.totalPaid)}</Typography>
                </Box>
              )}
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography fontWeight={800}>Net à payer</Typography>
                <Typography fontWeight={800} color={invoice.balance <= 0.01 ? 'success.main' : 'warning.main'}>
                  {formatCurrency(Math.max(0, invoice.balance))}
                </Typography>
              </Box>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                component="a"
                href={`${API_BASE}/public/invoices/${token}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                variant="outlined"
                startIcon={<PictureAsPdfOutlinedIcon />}
              >
                Facture PDF
              </Button>
              {(invoice.documentKind === 'deposit' || invoice.documentKind === 'remainder') && (
                <Button
                  component="a"
                  href={`${API_BASE}/public/invoices/${token}/engagement-contract.pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outlined"
                  startIcon={<PictureAsPdfOutlinedIcon />}
                >
                  Contrat de prestation
                </Button>
              )}
            </Stack>
          </Paper>
        </Grid>

        {showPayment && (
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, md: 3 },
                border: 1,
                borderColor: 'divider',
                position: { md: 'sticky' },
                top: 24,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                Paiement en ligne
              </Typography>
              {paymentContextLabel && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {paymentContextLabel}
                </Typography>
              )}
              <Box
                sx={{
                  py: 1.5,
                  px: 2,
                  mb: 2,
                  borderRadius: 2,
                  bgcolor: 'action.hover',
                  border: 1,
                  borderColor: 'success.light',
                  textAlign: 'center',
                }}
              >
                <Typography variant="caption" color="text.secondary" display="block">
                  Vous payez
                </Typography>
                <Typography variant="h4" fontWeight={800} color="success.main">
                  {formatCurrency(checkoutAmount ?? invoice.balance)}
                </Typography>
                {(checkoutAmount ?? 0) > 0 &&
                  (checkoutAmount ?? 0) < invoice.balance - 0.01 && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      Solde facture : {formatCurrency(invoice.balance)}
                    </Typography>
                  )}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: bnplHint ? 1 : 2 }}>
                Paiement sécurisé via Stripe (carte et autres moyens activés par votre prestataire).
              </Typography>
              {bnplHint && (
                <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                  {bnplHint}
                </Alert>
              )}

              {paymentError && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPaymentError(null)}>
                  {paymentError}
                </Alert>
              )}

              {invoice.installments && invoice.installments.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" sx={{ mb: 0.5 }}>
                    Plan de paiement
                  </Typography>
                  {invoice.installments.map((row) => (
                    <Typography
                      key={row.id}
                      variant="caption"
                      display="block"
                      color={
                        row.status === 'PAID'
                          ? 'success.main'
                          : row.overdue
                            ? 'error.main'
                            : 'text.secondary'
                      }
                    >
                      {row.label ?? `${row.sequence}.`} {formatDate(row.dueDate)} — {formatCurrency(row.amount)}
                      {row.status === 'PAID' ? ' · réglée' : row.overdue ? ' · en retard' : ''}
                    </Typography>
                  ))}
                </Box>
              )}

              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret: clientSecret!,
                  appearance: { theme: 'stripe' },
                }}
              >
                <StripeCheckoutForm
                  token={token!}
                  amount={checkoutAmount ?? invoice.balance}
                  currency={invoice.currency}
                  submitLabel="Confirmer le paiement"
                  onSuccess={() => {
                    setPaymentSuccess(true)
                    loadCheckout()
                  }}
                  onError={setPaymentError}
                />
              </Elements>
            </Paper>
          </Grid>
        )}

        {!isPaid && invoice.canPayOnline && !clientSecret && (
          <Grid size={{ xs: 12, md: 5 }}>
            <Alert severity={isBelowStripeMinimum ? 'info' : 'warning'}>
              {isBelowStripeMinimum
                ? "Le solde est inférieur à 0,50 EUR. Stripe ne permet pas un paiement en ligne sur ce montant."
                : "Le paiement en ligne est temporairement indisponible. Contactez l'émetteur de la facture."}
            </Alert>
          </Grid>
        )}
      </Grid>

      <PublicDataProcessingNotice
        issuerName={invoice.issuerName}
        privacyPolicyUrl={invoice.privacyPolicyUrl}
      />
    </Container>
  )
}
