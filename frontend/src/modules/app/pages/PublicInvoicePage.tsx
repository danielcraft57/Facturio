import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

type StripeJsPromise = ReturnType<typeof loadStripe>
import { ApiClient } from '../../../services/apiClient'
import { formatCurrency, formatDate } from '../../../utils/formatters'
import { PublicDataProcessingNotice } from '../../legal/PublicDataProcessingNotice'
import { InvoicePublicSkeleton } from '../../../components/loading/InvoicePublicSkeleton'
import { resolveApiBaseUrl } from '../../../utils/resolveApiBaseUrl'
import type { PublicInvoiceSummary } from './ClientInvoicePage'

const api = ApiClient.getInstance()
const API_BASE = resolveApiBaseUrl()

function InvoicePaymentForm({
  amount,
  currency,
  token,
  onSuccess,
  onError,
}: {
  token: string
  amount: number
  currency: string
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
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <PaymentElement onReady={() => setElementsReady(true)} />
      <Button
        type="submit"
        variant="contained"
        color="success"
        fullWidth
        sx={{ mt: 2 }}
        disabled={!stripe || !elementsReady || submitting}
      >
        {submitting ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          `Payer ${formatCurrency(amount)} ${currency}`
        )}
      </Button>
    </Box>
  )
}

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

/**
 * Page publique d'affichage d'une facture par token.
 * Paiement via le Stripe prestataire (clés organisation), montant = prochaine échéance si plan actif.
 */
export function PublicInvoicePage() {
  const { token } = useParams<{ token: string }>()
  const [invoice, setInvoice] = useState<PublicInvoiceSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
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
    } catch {
      setError('Facture introuvable')
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

  const showPayment = useMemo(() => {
    return (
      !isPaid &&
      !!invoice?.canPayOnline &&
      !!clientSecret &&
      !!stripePromise &&
      !isBelowStripeMinimum
    )
  }, [isPaid, invoice, clientSecret, stripePromise, isBelowStripeMinimum])

  const payAmount = checkoutAmount ?? invoice?.balance ?? 0

  const installmentHint = useMemo(() => {
    if (!invoice?.nextInstallment) return null
    const seq = checkoutInstallmentSequence ?? invoice.nextInstallment.sequence
    const amount = checkoutAmount ?? invoice.nextInstallment.amount
    return `Échéance ${seq} : ${formatCurrency(amount)} (échéancier ${invoice.installments?.length ?? ''} fois)`
  }, [invoice, checkoutAmount, checkoutInstallmentSequence])

  const bnplHint = useMemo(() => {
    if (bnplMethods.length === 0) return null
    const labels = bnplMethods
      .map((m) => (m === 'klarna' ? 'Klarna' : m === 'alma' ? 'Alma' : m))
      .join(' ou ')
    return `Paiement en plusieurs fois disponible (${labels}) — réservé aux particuliers.`
  }, [bnplMethods])

  if (loading) {
    return <InvoicePublicSkeleton />
  }

  if (error || !invoice) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Facture introuvable'}</Alert>
        <Typography sx={{ mt: 2 }}>
          <RouterLink to="/">Retour à l'accueil</RouterLink>
        </Typography>
      </Container>
    )
  }

  const clientName = invoice.client?.name || ''
  const lines = invoice.lines || []

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
          Facture {invoice.number}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Date : {formatDate(invoice.date)} · Client : {clientName}
        </Typography>
        {invoice.dueDate && (
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Échéance : {formatDate(invoice.dueDate)}
          </Typography>
        )}

        {isPaid && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Cette facture est réglée.
          </Alert>
        )}

        {!isPaid && invoice.balance > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Solde restant : {formatCurrency(invoice.balance)}
            {installmentHint && (
              <>
                <br />
                {installmentHint}
              </>
            )}
          </Alert>
        )}

        {invoice.installments && invoice.installments.length > 0 && (
          <Box sx={{ mb: 2, p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
              Plan de paiement
            </Typography>
            {invoice.installments.map((row) => (
              <Typography
                key={row.id}
                variant="body2"
                color={
                  row.status === 'PAID'
                    ? 'success.main'
                    : row.overdue
                      ? 'error.main'
                      : 'text.secondary'
                }
              >
                {row.sequence}. {formatDate(row.dueDate)} — {formatCurrency(row.amount)}
                {row.status === 'PAID' ? ' · réglée' : row.overdue ? ' · en retard' : ''}
              </Typography>
            ))}
          </Box>
        )}

        <TableContainer sx={{ mb: 3 }}>
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
              {lines.map((line, index) => (
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

        <Typography variant="h6" sx={{ mb: 3 }}>
          Total TTC : {formatCurrency(invoice.total)}
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: showPayment ? 3 : 0 }}>
          <Button
            component="a"
            href={`${API_BASE}/public/invoices/${token}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            variant="outlined"
          >
            Télécharger le PDF
          </Button>
        </Box>

        {!isPaid && invoice.canPayOnline && !clientSecret && (
          <Alert severity={isBelowStripeMinimum ? 'info' : 'warning'} sx={{ mb: 2 }}>
            {isBelowStripeMinimum
              ? 'Le solde est inférieur à 0,50 EUR. Stripe ne permet pas un paiement en ligne sur ce montant.'
              : "Le paiement en ligne est temporairement indisponible. Contactez l'émetteur de la facture."}
          </Alert>
        )}

        {paymentError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPaymentError(null)}>
            {paymentError}
          </Alert>
        )}

        {paymentSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Paiement enregistré. Merci !
          </Alert>
        )}

        {showPayment && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
              Paiement sécurisé par carte
            </Typography>
            {installmentHint && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {installmentHint}
              </Typography>
            )}
            <Typography variant="h5" fontWeight={800} color="success.main" sx={{ mb: 1 }}>
              {formatCurrency(payAmount)}
            </Typography>
            {payAmount > 0 && payAmount < invoice.balance - 0.01 && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                Solde facture : {formatCurrency(invoice.balance)}
              </Typography>
            )}
            {bnplHint && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {bnplHint}
              </Alert>
            )}
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: clientSecret!,
                appearance: { theme: 'stripe' },
              }}
            >
              <InvoicePaymentForm
                token={token!}
                amount={payAmount}
                currency={invoice.currency || 'EUR'}
                onSuccess={() => {
                  setPaymentSuccess(true)
                  loadCheckout()
                }}
                onError={setPaymentError}
              />
            </Elements>
          </Paper>
        )}
      </Paper>
      <PublicDataProcessingNotice
        issuerName={invoice.issuerName || clientName}
        privacyPolicyUrl={invoice.privacyPolicyUrl}
      />
    </Container>
  )
}
