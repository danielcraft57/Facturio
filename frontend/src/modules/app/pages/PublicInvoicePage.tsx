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
  onSuccess: (paymentIntentId: string) => void
  onError: (message: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!stripe || !elements) return

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
      onSuccess(paymentIntent.id)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <PaymentElement />
      <Button
        type="submit"
        variant="contained"
        color="success"
        fullWidth
        sx={{ mt: 2 }}
        disabled={!stripe || submitting}
      >
        {submitting ? <CircularProgress size={24} color="inherit" /> : `Payer ${formatCurrency(amount)} ${currency}`}
      </Button>
    </Box>
  )
}

/**
 * Page publique d'affichage d'une facture par token.
 * Paiement via le Stripe **prestataire** (clés organisation), pas le Stripe plateforme Facturio.
 */
export function PublicInvoicePage() {
  const { token } = useParams<{ token: string }>()
  const [invoice, setInvoice] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [stripePromise, setStripePromise] = useState<StripeJsPromise | null>(null)
  const [orgPublishableKey, setOrgPublishableKey] = useState<string | null>(null)

  const reloadInvoice = useCallback(() => {
    if (!token) return
    return api.get<any>(`public/invoices/${token}`).then((res: any) => {
      const data = res?.id ? res : res?.data?.data ?? res?.data
      if (data?.id || data?.number) {
        setInvoice(data)
        const pk = data.stripePublishableKey?.trim() || null
        if (pk) setOrgPublishableKey(pk)
      } else if (res?.error) setError(res.error)
      else setError('Facture introuvable')
    }).catch(() => setError('Facture introuvable'))
  }, [token])

  useEffect(() => {
    reloadInvoice()
  }, [reloadInvoice])

  useEffect(() => {
    if (orgPublishableKey) {
      setStripePromise(loadStripe(orgPublishableKey))
    } else {
      setStripePromise(null)
    }
  }, [orgPublishableKey])

  const canPayOnline = useMemo(() => {
    if (!invoice || paymentSuccess) return false
    const balance = Number(invoice.balance ?? invoice.total ?? 0)
    return balance > 0 && !!invoice.stripeEnabled && !!orgPublishableKey
  }, [invoice, paymentSuccess, orgPublishableKey])

  const startPayment = async () => {
    if (!token) return
    setPaymentError(null)
    setPaymentLoading(true)
    try {
      const res: {
        clientSecret?: string
        stripePublishableKey?: string
        data?: { clientSecret?: string; stripePublishableKey?: string }
        error?: string
      } = await api.post(`public/invoices/${token}/create-payment-intent`, {})
      const nested = res?.data
      const payload =
        res?.clientSecret != null
          ? res
          : nested?.clientSecret != null
            ? nested
            : undefined
      const secret = payload?.clientSecret
      const pk = payload?.stripePublishableKey
      if (secret) {
        setClientSecret(secret)
        if (pk) setOrgPublishableKey(pk)
      } else {
        setPaymentError(res?.error || 'Impossible de préparer le paiement')
      }
    } catch {
      setPaymentError('Impossible de préparer le paiement')
    } finally {
      setPaymentLoading(false)
    }
  }

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    if (token) {
      await api.post(`public/invoices/${token}/confirm-payment`, { paymentIntentId })
    }
    setPaymentSuccess(true)
    setClientSecret(null)
    await reloadInvoice()
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Typography sx={{ mt: 2 }}>
          <RouterLink to="/">Retour à l'accueil</RouterLink>
        </Typography>
      </Container>
    )
  }

  if (!invoice) {
    return <InvoicePublicSkeleton />
  }

  const clientName = invoice.client?.name || invoice.client?.companyName || ''
  const lines = invoice.lines || []
  const balance = Number(invoice.balance ?? 0)
  const isPaid = balance <= 0 || invoice.status === 'PAID'

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
          Facture {invoice.number}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Date : {formatDate(invoice.date || invoice.createdAt)} · Client : {clientName}
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

        {!isPaid && balance > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Solde restant : {formatCurrency(balance)}
          </Alert>
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
              {lines.map((line: any) => (
                <TableRow key={line.id}>
                  <TableCell>{line.description}</TableCell>
                  <TableCell align="right">{line.quantity}</TableCell>
                  <TableCell align="right">{formatCurrency(Number(line.unitPrice || 0))}</TableCell>
                  <TableCell align="right">{formatCurrency(Number(line.total || 0))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="h6" sx={{ mb: 3 }}>
          Total TTC : {formatCurrency(Number(invoice.total || 0))}
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: canPayOnline ? 3 : 0 }}>
          <Button
            component="a"
            href={`${API_BASE}/public/invoices/${token}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            variant="outlined"
          >
            Télécharger le PDF
          </Button>

          {canPayOnline && !clientSecret && (
            <Button
              variant="contained"
              color="success"
              onClick={startPayment}
              disabled={paymentLoading}
            >
              {paymentLoading ? 'Préparation...' : 'Payer en ligne'}
            </Button>
          )}
        </Box>

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

        {canPayOnline && clientSecret && stripePromise && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
              Paiement sécurisé par carte
            </Typography>
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: { theme: 'stripe' },
              }}
            >
              <InvoicePaymentForm
                token={token!}
                amount={balance}
                currency={invoice.currency || 'EUR'}
                onSuccess={handlePaymentSuccess}
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
