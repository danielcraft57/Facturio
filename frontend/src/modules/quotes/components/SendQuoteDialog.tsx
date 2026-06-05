import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  TextField,
  Typography,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import type { Quote } from '../../../types/quote'
import { organizationService, type OrganizationProfile } from '../../../services/organizationService'
import { unwrapApiPayload } from '../../../services/clients'
import { useAuthStore } from '../../../stores/authStore'

export type SendQuotePayload = {
  to: string
  updateClientEmail: boolean
  copyToSelf: boolean
  additionalRecipients: string
}

type Props = {
  open: boolean
  quote: Quote | null
  onClose: () => void
  onSend: (payload: SendQuotePayload) => void | Promise<void>
  sending?: boolean
}

export function SendQuoteDialog({ open, quote, onClose, onSend, sending = false }: Props) {
  const [email, setEmail] = useState('')
  const [updateClientEmail, setUpdateClientEmail] = useState(true)
  const [stripeConfigured, setStripeConfigured] = useState<boolean | null>(null)
  const [copyToSelf, setCopyToSelf] = useState(true)
  const [additionalRecipients, setAdditionalRecipients] = useState('')
  const currentUser = useAuthStore((s) => s.user)

  const clientHasEmail = Boolean(quote?.client?.email?.trim())

  useEffect(() => {
    if (open && quote) {
      setEmail(quote.client?.email || '')
      setUpdateClientEmail(!clientHasEmail)
      setCopyToSelf(true)
      setAdditionalRecipients('')
    }
  }, [open, quote, clientHasEmail])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setStripeConfigured(null)
    void (async () => {
      try {
        const res = await organizationService.getProfile()
        const profile = unwrapApiPayload<OrganizationProfile>(res)
        const configured = Boolean(
          profile?.invoiceStripeSecretKeySet === true &&
            ((profile?.invoiceStripePublishableKeyPreview ?? '').trim() ||
              (profile?.invoiceStripePublishableKey ?? '').trim()),
        )
        if (!cancelled) setStripeConfigured(configured)
      } catch {
        if (!cancelled) setStripeConfigured(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open])

  const handleSubmit = async () => {
    const to = email.trim()
    if (!to) return
    await onSend({
      to,
      updateClientEmail,
      copyToSelf,
      additionalRecipients,
    })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth disableRestoreFocus>
      <DialogTitle>Envoyer le devis par email</DialogTitle>
      <DialogContent>
        {quote && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Devis <strong>{quote.number}</strong>
            </Typography>

            {stripeConfigured === false && (
              <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                <Typography fontWeight={800} sx={{ mb: 0.5 }}>
                  Facturation et paiement en ligne indisponibles
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Vous pouvez envoyer ce devis par email. Sans paiement en ligne configuré, le client ne pourra pas
                  l’accepter pour générer une facture ni le régler en ligne.
                </Typography>
                <Button
                  component={RouterLink}
                  to="/parametres/paiements"
                  variant="outlined"
                  size="small"
                >
                  Configurer les paiements en ligne
                </Button>
              </Alert>
            )}

            <TextField
              fullWidth
              required
              type="email"
              label="Email du client"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@exemple.com"
              autoFocus
              margin="dense"
            />
            {!clientHasEmail && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={updateClientEmail}
                    onChange={(e) => setUpdateClientEmail(e.target.checked)}
                  />
                }
                label="Enregistrer cet email sur la fiche client"
                sx={{ mt: 1 }}
              />
            )}
            <FormControlLabel
              control={
                <Checkbox
                  checked={copyToSelf}
                  onChange={(e) => setCopyToSelf(e.target.checked)}
                />
              }
              label="M’envoyer une copie (sans lien d’acceptation / paiement)"
              sx={{ mt: 1 }}
            />
            {copyToSelf && (
              <>
                <TextField
                  fullWidth
                  margin="dense"
                  type="email"
                  label="M’envoyer une copie à"
                  value={currentUser?.email ?? ''}
                  InputProps={{ readOnly: true }}
                  helperText="Copie informative sans lien d’acceptation ni de paiement."
                />
                <TextField
                  fullWidth
                  margin="dense"
                  label="Autres destinataires (copie)"
                  placeholder="copie1@exemple.com, copie2@exemple.com"
                  value={additionalRecipients}
                  onChange={(e) => setAdditionalRecipients(e.target.value)}
                  helperText="Séparez les adresses par des virgules, des points-virgules ou des retours à la ligne."
                />
              </>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={sending}>
          Annuler
        </Button>
        <Button
          variant="contained"
          startIcon={<SendIcon />}
          onClick={() => void handleSubmit()}
          disabled={sending || !email.trim()}
        >
          {sending ? 'Envoi…' : 'Envoyer'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

