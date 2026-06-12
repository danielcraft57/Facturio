import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Checkbox,
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
import { formatCurrency, formatDate } from '../../../utils/formatters'
import {
  previewInstallmentWithDeposit,
  resolveInitialInstallmentPayment,
  type SmartInstallmentHint,
} from '../../../utils/quoteSmartInstallment'

const api = ApiClient.getInstance()

function sanitizePublicClientError(message: string | undefined): string {
  if (!message?.trim()) return "Erreur lors de l'acceptation."
  if (message.includes('/parametres/paiements') || /stripe/i.test(message)) {
    return "Le règlement en ligne n'est pas disponible. Contactez votre prestataire pour finaliser ce devis."
  }
  return message
}

type PublicQuoteSummary = {
  status?: string
  number?: string
  publicPaymentHints?: {
    hasDepositSplit?: boolean
    depositPaid?: boolean
    onlinePaymentAvailable?: boolean
    quoteTotal?: number
    smartInstallment?: SmartInstallmentHint | null
    hasInstallmentInvoice?: boolean
    installmentInvoiceToken?: string | null
  }
}

type AcceptPayResponse = {
  status?: string
  invoiceToken?: string
  depositInvoiceToken?: string
  remainderInvoiceToken?: string
  message?: string
  onlinePaymentAvailable?: boolean
  initialPaymentAmount?: number
  installmentCount?: number
  withDeposit?: boolean
}

type PayMode = 'FULL' | 'DEPOSIT' | 'INSTALLMENT'

/** Page publique : acceptation d'un devis par token. */
export function PublicQuoteAcceptPage() {
  const { token } = useParams<{ token: string }>()
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string>('')
  const [mode, setMode] = useState<PayMode | null>(null)
  const [installmentWithDeposit, setInstallmentWithDeposit] = useState(false)
  const [depositInvoiceToken, setDepositInvoiceToken] = useState<string | null>(null)
  const [remainderInvoiceToken, setRemainderInvoiceToken] = useState<string | null>(null)
  const [invoiceToken, setInvoiceToken] = useState<string | null>(null)
  const [quoteSummary, setQuoteSummary] = useState<PublicQuoteSummary | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(true)
  const [onlinePaymentAvailable, setOnlinePaymentAvailable] = useState(true)

  const quoteTotal = quoteSummary?.publicPaymentHints?.quoteTotal ?? 0
  const smartInstallment = quoteSummary?.publicPaymentHints?.smartInstallment ?? null
  const hasInstallmentOption = Boolean(smartInstallment?.eligible)

  const installmentPreview = useMemo(() => {
    if (!smartInstallment?.preview?.length) return []
    if (!installmentWithDeposit || mode !== 'INSTALLMENT') return smartInstallment.preview
    return previewInstallmentWithDeposit(smartInstallment.preview, quoteTotal, 0.1)
  }, [smartInstallment, installmentWithDeposit, mode, quoteTotal])

  const initialInstallmentPayment = useMemo(() => {
    if (!smartInstallment?.preview?.length || mode !== 'INSTALLMENT') return 0
    return resolveInitialInstallmentPayment(
      quoteTotal,
      smartInstallment.preview,
      installmentWithDeposit,
      0.1,
    )
  }, [smartInstallment, mode, quoteTotal, installmentWithDeposit])

  const applyAcceptResponse = useCallback((body: AcceptPayResponse) => {
    if (body?.status !== 'accepted') return false

    if (body.onlinePaymentAvailable === false) {
      setOnlinePaymentAvailable(false)
    }
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
        if (!cancelled) {
          const summary = body as PublicQuoteSummary
          setQuoteSummary(summary)
          setOnlinePaymentAvailable(summary.publicPaymentHints?.onlinePaymentAvailable !== false)
          if (summary.publicPaymentHints?.hasInstallmentInvoice) {
            setMode('INSTALLMENT')
          }
        }
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
    if (quoteSummary?.publicPaymentHints?.hasInstallmentInvoice) {
      setMode('INSTALLMENT')
      return
    }
    setMode(null)
  }, [
    quoteLoading,
    quoteSummary?.publicPaymentHints?.hasDepositSplit,
    quoteSummary?.publicPaymentHints?.depositPaid,
    quoteSummary?.publicPaymentHints?.hasInstallmentInvoice,
  ])

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

    const hasDepositSplit = Boolean(quoteSummary?.publicPaymentHints?.hasDepositSplit)
    const depositPaid = Boolean(quoteSummary?.publicPaymentHints?.depositPaid)

    const effectiveMode: PayMode | null = depositPaid
      ? 'DEPOSIT'
      : hasDepositSplit
        ? 'DEPOSIT'
        : mode

    if (onlinePaymentAvailable && !effectiveMode) {
      setStatus('error')
      setMessage('Choisissez un mode de paiement.')
      return
    }

    try {
      const res = onlinePaymentAvailable
        ? await api.post<AcceptPayResponse>(`public/quotes/${token}/accept-pay`, {
            mode: effectiveMode === 'DEPOSIT' ? 'DEPOSIT' : effectiveMode === 'INSTALLMENT' ? 'INSTALLMENT' : 'FULL',
            ...(effectiveMode === 'DEPOSIT' ? { depositRate: 0.1 } : {}),
            ...(effectiveMode === 'INSTALLMENT'
              ? { withDeposit: installmentWithDeposit, depositRate: 0.1 }
              : {}),
          })
        : await api.post<AcceptPayResponse>(`public/quotes/${token}/accept`, {})
      const body = (res as { data?: AcceptPayResponse }).data ?? (res as AcceptPayResponse)

      if (applyAcceptResponse(body)) return

      const errMsg =
        (res as { error?: string }).error ||
        (res as { message?: string }).message ||
        "Erreur lors de l'acceptation."
      setStatus('error')
      setMessage(errMsg)
    } catch (err: unknown) {
      setStatus('error')
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      setMessage(sanitizePublicClientError(e?.response?.data?.message || e?.message))
    }
  }

  const alreadyAccepted = quoteSummary?.status === 'ACCEPTED'
  const hasDepositSplit = Boolean(quoteSummary?.publicPaymentHints?.hasDepositSplit)
  const depositPaid = Boolean(quoteSummary?.publicPaymentHints?.depositPaid)
  const hasInstallmentInvoice = Boolean(quoteSummary?.publicPaymentHints?.hasInstallmentInvoice)
  const isRejected = quoteSummary?.status === 'REJECTED'
  const isExpired = quoteSummary?.status === 'EXPIRED'
  const effectiveMode = depositPaid ? 'DEPOSIT' : hasDepositSplit ? 'DEPOSIT' : mode
  const canSubmit = onlinePaymentAvailable ? Boolean(effectiveMode) : true
  const depositFlow = onlinePaymentAvailable && (hasDepositSplit || mode === 'DEPOSIT')
  const installmentFlow = onlinePaymentAvailable && (hasInstallmentInvoice || mode === 'INSTALLMENT')
  const canReject =
    !isRejected && !isExpired && !alreadyAccepted && !hasDepositSplit && !depositPaid && !hasInstallmentInvoice

  const pageTitle = !onlinePaymentAvailable
    ? 'Accepter le devis'
    : depositPaid
      ? 'Paiement du solde'
      : installmentFlow
        ? 'Paiement en plusieurs fois'
        : alreadyAccepted && depositFlow
          ? 'Paiement acompte'
          : alreadyAccepted
            ? 'Paiement du devis'
            : depositFlow
              ? "Accepter et payer l'acompte"
              : 'Accepter le devis'

  const paymentHintsResolved =
    !quoteLoading &&
    (quoteSummary === null ||
      depositPaid ||
      !quoteSummary.publicPaymentHints?.hasDepositSplit ||
      mode === 'DEPOSIT' ||
      hasInstallmentInvoice ||
      mode === 'INSTALLMENT')
  const showAcceptForm =
    paymentHintsResolved && status === 'idle' && !isRejected && !isExpired && quoteSummary !== null

  const submitLabel = (() => {
    if (!onlinePaymentAvailable) return 'Accepter le devis'
    if (depositPaid) return 'Obtenir le lien de paiement du solde'
    if (installmentFlow) {
      if (alreadyAccepted) return 'Obtenir le lien de paiement'
      if (installmentWithDeposit) {
        return `Accepter et payer l'acompte (${formatCurrency(initialInstallmentPayment)})`
      }
      return `Accepter et payer la 1re échéance (${formatCurrency(initialInstallmentPayment)})`
    }
    if (depositFlow) {
      return alreadyAccepted ? 'Obtenir le lien de paiement acompte' : "Accepter et payer l'acompte (10 %)"
    }
    if (alreadyAccepted) return 'Obtenir le lien de paiement 100%'
    return 'Accepter et payer 100%'
  })()

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
              ? "Ce devis a été refusé. Aucune action supplémentaire n'est possible."
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
            {hasInstallmentInvoice
              ? 'Réglez la prochaine échéance via le lien ci-dessous.'
              : hasDepositSplit
                ? 'Obtenez ci-dessous le lien de paiement acompte.'
                : 'Choisissez ci-dessous comment régler.'}
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
              {!onlinePaymentAvailable
                ? 'En acceptant ce devis, vous confirmez votre accord.'
                : hasInstallmentInvoice
                  ? 'Votre plan de paiement est actif : réglez la prochaine échéance en ligne.'
                  : 'Choisissez comment régler : en une fois, par acompte 10 %, ou en plusieurs fois selon le montant.'}
            </Typography>

            {onlinePaymentAvailable && !depositPaid && !hasDepositSplit && !hasInstallmentInvoice && (
              <RadioGroup
                value={mode ?? ''}
                onChange={(e) => setMode(e.target.value as PayMode)}
                name="pay-mode"
                sx={{ mb: 2, textAlign: 'left' }}
              >
                <FormControlLabel
                  value="FULL"
                  control={<Radio />}
                  label="Paiement 100 % (tout de suite)"
                />
                <FormControlLabel value="DEPOSIT" control={<Radio />} label="Paiement acompte (10 %)" />
                {hasInstallmentOption && smartInstallment && (
                  <FormControlLabel
                    value="INSTALLMENT"
                    control={<Radio />}
                    label={`Paiement en plusieurs fois — ${smartInstallment.label} (${formatCurrency(quoteTotal)})`}
                  />
                )}
              </RadioGroup>
            )}

            {mode === 'INSTALLMENT' && smartInstallment && !hasInstallmentInvoice && (
              <Box sx={{ mb: 2, textAlign: 'left' }}>
                <Alert severity="info" sx={{ mb: 1.5 }}>
                  Plan proposé : <strong>{smartInstallment.label}</strong> sur{' '}
                  {formatCurrency(quoteTotal)} TTC.
                </Alert>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={installmentWithDeposit}
                      onChange={(e) => setInstallmentWithDeposit(e.target.checked)}
                    />
                  }
                  label="Verser un acompte de 10 % à la commande (réglé dès l'acceptation)"
                />
                <Stack spacing={0.5} sx={{ mt: 1, pl: 0.5 }}>
                  {installmentPreview.map((row) => (
                    <Typography key={`${row.sequence}-${row.label ?? 'ech'}`} variant="body2" color="text.secondary">
                      {row.label ?? `Éch. ${row.sequence}`} — {formatDate(row.dueDate)} :{' '}
                      {formatCurrency(row.amount)}
                    </Typography>
                  ))}
                </Stack>
                {initialInstallmentPayment > 0 && (
                  <Typography variant="body2" fontWeight={700} sx={{ mt: 1 }}>
                    À régler maintenant : {formatCurrency(initialInstallmentPayment)}
                  </Typography>
                )}
              </Box>
            )}

            {hasDepositSplit && !depositPaid && (
              <Alert severity="info" sx={{ mb: 2, textAlign: 'left' }}>
                Le paiement à 100 % n'est plus disponible. Réglez d'abord l'acompte.
              </Alert>
            )}

            <Button variant="contained" onClick={() => void handleAccept()} disabled={!canSubmit}>
              {submitLabel}
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
                <Button component={RouterLink} to={`/facture/${invoiceToken}`} variant="contained" color="primary">
                  {onlinePaymentAvailable ? 'Payer en ligne' : 'Voir la facture'}
                </Button>
              )}
              {depositInvoiceToken && (
                <Button
                  component={RouterLink}
                  to={`/facture/${depositInvoiceToken}`}
                  variant="contained"
                  color={depositPaid ? 'inherit' : 'primary'}
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
              <Button component={RouterLink} to="/" variant="text">
                Retour à l'accueil
              </Button>
            </Stack>
          </>
        )}

        {status === 'error' && (
          <>
            <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
              {message}
            </Alert>
            <Button variant="outlined" sx={{ mr: 1 }} onClick={() => setStatus('idle')}>
              Réessayer
            </Button>
            <Button component={RouterLink} to="/" variant="outlined">
              Retour à l'accueil
            </Button>
          </>
        )}
      </Paper>
    </Container>
  )
}
