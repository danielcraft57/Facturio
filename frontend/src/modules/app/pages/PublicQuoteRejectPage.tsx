import { useEffect, useMemo, useState } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { ApiClient } from '../../../services/apiClient'

const api = ApiClient.getInstance()

type PublicQuoteSummary = {
  status?: string
  number?: string
  expiryDate?: string | null
}

/** Page publique : refus d'un devis par token. */
export function PublicQuoteRejectPage() {
  const { token } = useParams<{ token: string }>()
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string>('')
  const [quoteLoading, setQuoteLoading] = useState(true)
  const [quote, setQuote] = useState<PublicQuoteSummary | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Token manquant')
      setQuoteLoading(false)
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const res = await api.get<PublicQuoteSummary>(`public/quotes/${token}`)
        const body = (res as { data?: PublicQuoteSummary }).data ?? res
        if (!cancelled) setQuote(body as PublicQuoteSummary)
      } catch {
        if (!cancelled) {
          setStatus('error')
          setMessage('Devis introuvable ou lien expiré')
          setQuote(null)
        }
      } finally {
        if (!cancelled) setQuoteLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  const quoteStatus = quote?.status ?? null
  const lockedReason = useMemo(() => {
    if (!quoteStatus) return null
    if (quoteStatus === 'REJECTED') return 'Ce devis est déjà refusé.'
    if (quoteStatus === 'ACCEPTED') return 'Ce devis est déjà accepté. Il ne peut plus être refusé.'
    if (quoteStatus === 'EXPIRED') return 'Ce devis a expiré.'
    return null
  }, [quoteStatus])

  const canReject = !quoteLoading && !lockedReason && status !== 'loading'

  const doReject = async () => {
    if (!token) return
    setConfirmOpen(false)
    setStatus('loading')
    setMessage('')
    try {
      const res = await api.post<{ status?: string }>(`public/quotes/${token}/reject`, {})
      if (res.success !== false && !res.error) {
        setStatus('success')
        setMessage('Devis refusé. Merci de nous avoir prévenu.')
      } else if (res.error) {
        setStatus('error')
        setMessage(res.error)
      } else {
        setStatus('success')
        setMessage('Devis refusé.')
      }
    } catch (err: any) {
      setStatus('error')
      setMessage(err?.response?.data?.message || err?.message || 'Erreur lors du refus.')
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
        {quoteLoading && (
          <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
            <CircularProgress size={18} />
            <Typography variant="body2" color="text.secondary">
              Chargement du devis…
            </Typography>
          </Stack>
        )}

        {!quoteLoading && lockedReason && (
          <>
            <Alert severity="info" sx={{ mb: 2 }}>
              {lockedReason}
            </Alert>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="center">
              <Button component={RouterLink} to="/" variant="contained">
                Retour à l&apos;accueil
              </Button>
              {quoteStatus === 'ACCEPTED' && token && (
                <Button component={RouterLink} to={`/public/devis/${token}/accepter`} variant="outlined">
                  Accéder au paiement
                </Button>
              )}
            </Stack>
          </>
        )}

        {!quoteLoading && !lockedReason && status === 'idle' && (
          <>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>
              Refuser ce devis ?
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              {quote?.number ? (
                <>
                  Devis <strong>{quote.number}</strong>
                </>
              ) : (
                <>Devis</>
              )}{' '}
              — cette action est définitive.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="center">
              <Button component={RouterLink} to={`/public/devis/${token}/accepter`} variant="contained" color="success">
                Accepter (et payer)
              </Button>
              <Button variant="outlined" color="error" onClick={() => setConfirmOpen(true)} disabled={!canReject}>
                Refuser le devis
              </Button>
            </Stack>
          </>
        )}

        {status === 'loading' && (
          <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
            <CircularProgress size={18} />
            <Typography>Enregistrement de votre refus…</Typography>
          </Stack>
        )}

        {status === 'success' && (
          <>
            <Alert severity="info" sx={{ mb: 2 }}>
              {message}
            </Alert>
            <Button component={RouterLink} to="/" variant="contained">
              Retour à l&apos;accueil
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <Alert severity="error" sx={{ mb: 2 }}>
              {message}
            </Alert>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="center">
              <Button component={RouterLink} to="/" variant="outlined">
                Retour à l&apos;accueil
              </Button>
              {token && (
                <Button component={RouterLink} to={`/public/devis/${token}/accepter`} variant="contained">
                  Aller à l&apos;acceptation
                </Button>
              )}
            </Stack>
          </>
        )}
      </Paper>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirmer le refus</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Confirmez-vous le refus de ce devis ? Cette action est définitive.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Annuler</Button>
          <Button color="error" variant="contained" onClick={() => void doReject()}>
            Confirmer le refus
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
