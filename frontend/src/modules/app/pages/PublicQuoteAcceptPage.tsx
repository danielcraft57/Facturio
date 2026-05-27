import { useCallback, useEffect, useState } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Button,
  CircularProgress,
  Container,
  FormControlLabel,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from '@mui/material'
import { ApiClient } from '../../../services/apiClient'

const api = ApiClient.getInstance()

type AcceptPayResponse = {
  status?: string
  invoiceToken?: string
  depositInvoiceToken?: string
  remainderInvoiceToken?: string
  message?: string
}

type PublicQuoteSummary = {
  status?: string
  number?: string
  publicPaymentHints?: {
    hasDepositSplit?: boolean
    depositPaid?: boolean
  }
}

/** Page publique : acceptation d'un devis par token. */
export function PublicQuoteAcceptPage() {
  const { token } = useParams<{ token: string }>()
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string>('')
  const [mode, setMode] = useState<'FULL' | 'DEPOSIT' | null>(null)
  const [depositInvoiceToken, setDepositInvoiceToken] = useState<string | null>(null)
  const [remainderInvoiceToken, setRemainderInvoiceToken] = useState<string | null>(null)
  const [invoiceToken, setInvoiceToken] = useState<string | null>(null)
  const [quoteSummary, setQuoteSummary] = useState<PublicQuoteSummary | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(true)

  const applyAcceptResponse = useCallback((body: AcceptPayResponse) => {
    if (body?.status !== 'accepted') return false

    setStatus('success')
    if (body.invoiceToken) {
      setInvoiceToken(body.invoiceToken)
      setMessage(body.message || 'Devis accepté. Votre facture est prête à être réglée.')
      return true
    }
    if (body.depositInvoiceToken) {
      setDepositInvoiceToken(body.depositInvoiceToken)
      setRemainderInvoiceToken(body.remainderInvoiceToken ?? null)
      setMessage(
        body.message ||
          (body.remainderInvoiceToken
            ? 'Acompte déjà réglé. Vous pouvez payer le solde.'
            : 'Devis accepté. Vous pouvez procéder au paiement acompte (10 %).'),
      )
      return true
    }
    setMessage(body.message || 'Devis accepté.')
    return true
  }, [])

  useEffect(() => {
    if (!token) {
      setQuoteLoading(false)
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const res = await api.get<PublicQuoteSummary>(`public/quotes/${token}`)
        const body = (res as { data?: PublicQuoteSummary }).data ?? res
        if (!cancelled) setQuoteSummary(body as PublicQuoteSummary)
      } catch {
        if (!cancelled) setQuoteSummary(null)
      } finally {
        if (!cancelled) setQuoteLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  // Si un split acompte/solde existe déjà, on force le mode DEPOSIT (FULL n'est plus autorisé).
  useEffect(() => {
    if (quoteLoading) return
    if (quoteSummary?.publicPaymentHints?.depositPaid) {
      setMode(null)
      return
    }
    if (quoteSummary?.publicPaymentHints?.hasDepositSplit) {
      setMode('DEPOSIT')
      return
    }
    setMode(null)
  }, [quoteLoading, quoteSummary?.publicPaymentHints?.hasDepositSplit, quoteSummary?.publicPaymentHints?.depositPaid])

  const handleAccept = async () => {
    if (!token) {
      setStatus('error')
      setMessage('Token manquant')
      return
    }

    setStatus('loading')
    setMessage('')
    setDepositInvoiceToken(null)
    setRemainderInvoiceToken(null)
    setInvoiceToken(null)

    const effectiveMode: 'FULL' | 'DEPOSIT' | null = depositPaid
      ? 'DEPOSIT'
      : hasDepositSplit
        ? 'DEPOSIT'
        : mode

    if (!effectiveMode) {
      setStatus('error')
      setMessage('Choisissez un mode de paiement : 100 % ou paiement acompte.')
      return
    }

    try {
      const payload =
        effectiveMode === 'DEPOSIT'
          ? { mode: 'DEPOSIT' as const, depositRate: 0.1 }
          : { mode: 'FULL' as const }
      const res = await api.post<AcceptPayResponse>(`public/quotes/${token}/accept-pay`, payload)
      const body = (res as { data?: AcceptPayResponse }).data ?? (res as AcceptPayResponse)

      if (applyAcceptResponse(body)) return

      const errMsg =
        (res as { error?: string }).error ||
        (res as { message?: string }).message ||
        'Erreur lors de l’acceptation.'
      setStatus('error')
      setMessage(errMsg)
    } catch (err: unknown) {
      setStatus('error')
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      setMessage(e?.response?.data?.message || e?.message || 'Erreur lors de l’acceptation.')
    }
  }

  const alreadyAccepted = quoteSummary?.status === 'ACCEPTED'
  const hasDepositSplit = Boolean(quoteSummary?.publicPaymentHints?.hasDepositSplit)
  const depositPaid = Boolean(quoteSummary?.publicPaymentHints?.depositPaid)
  const isRejected = quoteSummary?.status === 'REJECTED'
  const isExpired = quoteSummary?.status === 'EXPIRED'
  const effectiveMode = depositPaid ? 'DEPOSIT' : hasDepositSplit ? 'DEPOSIT' : mode
  const canSubmit = Boolean(effectiveMode)
  const depositFlow = hasDepositSplit || mode === 'DEPOSIT'
  const canReject = !isRejected && !isExpired && !alreadyAccepted && !hasDepositSplit && !depositPaid
  const pageTitle = depositPaid
    ? 'Paiement du solde'
    : alreadyAccepted && depositFlow
      ? 'Paiement acompte'
      : alreadyAccepted
        ? 'Paiement du devis'
        : depositFlow
          ? 'Accepter et payer l’acompte'
          : 'Accepter le devis'

  /** Attendre le devis + l’effet qui force DEPOSIT si split, pour éviter le flash des radios. */
  const paymentHintsResolved =
    !quoteLoading &&
    (quoteSummary === null ||
      depositPaid ||
      !quoteSummary.publicPaymentHints?.hasDepositSplit ||
      mode === 'DEPOSIT')
  const showAcceptForm =
    paymentHintsResolved && status === 'idle' && !isRejected && !isExpired && quoteSummary !== null

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
        {quoteLoading && (
          <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ py: 3 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              Chargement du devis…
            </Typography>
          </Stack>
        )}

        {!quoteLoading && !quoteSummary && status === 'idle' && (
          <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
            Devis introuvable ou lien expiré.
          </Alert>
        )}

        {!quoteLoading && (isRejected || isExpired) && status === 'idle' && (
          <Alert severity="info" sx={{ mb: 2, textAlign: 'left' }}>
            {isRejected
              ? 'Ce devis a été refusé. Aucune action supplémentaire n’est possible.'
              : 'Ce devis a expiré. Contactez votre prestataire pour un nouveau devis.'}
          </Alert>
        )}

        {!quoteLoading && alreadyAccepted && status === 'idle' && !depositPaid && showAcceptForm && (
          <Alert severity="info" sx={{ mb: 2, textAlign: 'left' }}>
            {quoteSummary?.number ? (
              <>
                Le devis <strong>{quoteSummary.number}</strong> est déjà accepté.
              </>
            ) : (
              <>Ce devis est déjà accepté.</>
            )}{' '}
            {hasDepositSplit
              ? 'Obtenez ci-dessous le lien de paiement acompte.'
              : 'Choisissez ci-dessous : paiement 100 % ou paiement acompte (10 %).'}
          </Alert>
        )}

        {!quoteLoading && alreadyAccepted && depositPaid && status === 'idle' && showAcceptForm && (
          <Alert severity="success" sx={{ mb: 2, textAlign: 'left' }}>
            L&apos;acompte de ce devis est déjà réglé. Vous pouvez obtenir le lien pour payer le solde.
          </Alert>
        )}

        {status === 'loading' && (
          <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
            <CircularProgress size={20} />
            <Typography>Enregistrement de votre acceptation...</Typography>
          </Stack>
        )}

        {showAcceptForm && (
          <>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>
              {pageTitle}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              {depositPaid
                ? 'L’acompte a déjà été réglé : vous pouvez payer le solde du devis.'
                : hasDepositSplit
                  ? 'Un paiement acompte a déjà été initié pour ce devis. Réglez l’acompte ou attendez le solde.'
                  : depositFlow
                    ? 'Acceptez le devis et procédez au paiement acompte (10 %), ou payez l’intégralité en une fois.'
                    : 'Choisissez comment vous souhaitez régler : en une fois ou par paiement acompte (10 %).'}
            </Typography>
            {!depositPaid && !hasDepositSplit && (
              <RadioGroup
                value={mode ?? ''}
                onChange={(e) => setMode(e.target.value as 'FULL' | 'DEPOSIT')}
                name="pay-mode"
                sx={{ mb: 2 }}
              >
                <FormControlLabel
                  value="FULL"
                  control={<Radio />}
                  disabled={hasDepositSplit}
                  label="Paiement 100% (tout de suite)"
                />
                <FormControlLabel value="DEPOSIT" control={<Radio />} label="Paiement acompte (10 %)" />
              </RadioGroup>
            )}
            {hasDepositSplit && !depositPaid && (
              <Alert severity="info" sx={{ mb: 2, textAlign: 'left' }}>
                Le paiement à 100 % n’est plus disponible. Réglez d’abord le paiement acompte ; le solde sera payable ensuite.
              </Alert>
            )}
            <Button variant="contained" onClick={() => void handleAccept()} disabled={!canSubmit}>
              {depositPaid
                ? 'Obtenir le lien de paiement du solde'
                : depositFlow
                  ? alreadyAccepted
                    ? 'Obtenir le lien de paiement acompte'
                    : 'Accepter et payer l’acompte (10 %)'
                  : alreadyAccepted
                    ? 'Obtenir le lien de paiement 100%'
                    : 'Accepter et payer 100%'}
            </Button>
            {canReject && token && (
              <Button
                component={RouterLink}
                to={`/public/devis/${token}/refuser`}
                variant="text"
                color="error"
                sx={{ display: 'block', mt: 1.5 }}
              >
                Refuser le devis
              </Button>
            )}
          </>
        )}

        {status === 'success' && (
          <>
            <Alert severity="success" sx={{ mb: 2, textAlign: 'left' }}>
              {message}
            </Alert>
            <Stack spacing={1} alignItems="center">
              {invoiceToken && (
                <Button component={RouterLink} to={`/facture/${invoiceToken}`} variant="contained" color="success">
                  Payer la facture en ligne
                </Button>
              )}
              {depositInvoiceToken && (
                <Button
                  component={RouterLink}
                  to={`/facture/${depositInvoiceToken}`}
                  variant="contained"
                  color={depositPaid ? 'inherit' : 'success'}
                >
                  {depositPaid ? "Voir facture d'acompte" : 'Paiement acompte en ligne'}
                </Button>
              )}
              {remainderInvoiceToken && (
                <Button
                  component={RouterLink}
                  to={`/facture/${remainderInvoiceToken}`}
                  variant="contained"
                  color="primary"
                >
                  Payer le solde en ligne
                </Button>
              )}
              {remainderInvoiceToken && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Si l&apos;acompte est déjà réglé, vous pouvez payer le solde ci-dessus.
                </Typography>
              )}
              <Button component={RouterLink} to="/" variant="text">
                Retour à l&apos;accueil
              </Button>
            </Stack>
          </>
        )}
        {status === 'error' && (
          <>
            <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
              {message}
            </Alert>
            {message.includes('/parametres/paiements') ? (
              <Button
                component={RouterLink}
                to="/parametres/paiements"
                variant="contained"
                color="warning"
                sx={{ mr: 1 }}
              >
                Configurer Stripe
              </Button>
            ) : null}
            <Button variant="outlined" sx={{ mr: 1 }} onClick={() => setStatus('idle')}>
              Réessayer
            </Button>
            <Button component={RouterLink} to="/" variant="outlined">
              Retour à l&apos;accueil
            </Button>
          </>
        )}
      </Paper>
    </Container>
  )
}
