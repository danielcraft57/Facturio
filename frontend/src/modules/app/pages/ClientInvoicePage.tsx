import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
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
  canPayOnline: boolean
  stripeEnabled: boolean
  stripePublishableKey?: string | null
  issuerName: string
  privacyPolicyUrl?: string | null
  dataControllerEmail?: string | null
  client: { name: string }
  lines: { description: string; quantity: number; unitPrice: number; total: number }[]
}

function StripeCheckoutForm({
  token,
  amount,
  currency,
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
      await api.post(`public/invoices/${token}/confirm-payment`, {
        paymentIntentId: paymentIntent.id,
      })
      onSuccess()
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <PaymentElement />
      <Button
        type="submit"
        variant="contained"
        color="success"
        size="large"
        fullWidth
        sx={{ mt: 3 }}
        disabled={!stripe || submitting}
      >
        {submitting ? (
          <CircularProgress size={26} color="inherit" />
        ) : (
          `Payer ${formatCurrency(amount)}`
        )}
      </Button>
    </Box>
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

  const loadCheckout = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      type CheckoutPayload = {
        invoice?: PublicInvoiceSummary
        payment?: { clientSecret: string; stripePublishableKey?: string }
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
      const pk =
        payload.payment?.stripePublishableKey ||
        payload.invoice.stripePublishableKey ||
        null
      setOrgPublishableKey(pk)
    } catch {
      setError('Facture introuvable ou lien expiré')
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

  const showPayment = useMemo(() => {
    return (
      !isPaid &&
      !!invoice?.canPayOnline &&
      !!clientSecret &&
      !!stripePromise
    )
  }, [isPaid, invoice, clientSecret, stripePromise])

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
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Facture {invoice.number}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Client : {invoice.client.name} · Émise le {formatDate(invoice.date)}
              {invoice.dueDate ? ` · Échéance ${formatDate(invoice.dueDate)}` : ''}
            </Typography>

            {isPaid && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Cette facture est réglée. Merci pour votre paiement.
              </Alert>
            )}

            {!isPaid && invoice.balance > 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Montant restant à régler : <strong>{formatCurrency(invoice.balance)}</strong>
              </Alert>
            )}

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
              {invoice.totalPaid > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">Déjà réglé</Typography>
                  <Typography>{formatCurrency(invoice.totalPaid)}</Typography>
                </Box>
              )}
            </Stack>

            <Button
              component="a"
              href={`${API_BASE}/public/invoices/${token}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              variant="outlined"
              startIcon={<PictureAsPdfOutlinedIcon />}
            >
              Télécharger le PDF
            </Button>
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
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                Paiement en ligne
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Règlement sécurisé par carte bancaire (Stripe).
              </Typography>

              {paymentError && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPaymentError(null)}>
                  {paymentError}
                </Alert>
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
                  amount={invoice.balance}
                  currency={invoice.currency}
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
            <Alert severity="warning">
              Le paiement en ligne est temporairement indisponible. Contactez l&apos;émetteur de la facture.
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
