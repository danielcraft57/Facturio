import { useEffect, useState } from 'react'
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
import type { Invoice } from '../../../services/invoices'

export type SendInvoicePayload = {
  to: string
  updateClientEmail: boolean
}

type SendInvoiceDialogProps = {
  open: boolean
  invoice: Invoice | null
  onClose: () => void
  onSend: (payload: SendInvoicePayload) => void | Promise<void>
  sending?: boolean
}

export function SendInvoiceDialog({
  open,
  invoice,
  onClose,
  onSend,
  sending = false,
}: SendInvoiceDialogProps) {
  const [email, setEmail] = useState('')
  const [updateClientEmail, setUpdateClientEmail] = useState(true)

  useEffect(() => {
    if (open && invoice) {
      setEmail(invoice.client?.email || '')
      setUpdateClientEmail(true)
    }
  }, [open, invoice])

  const isPaid = invoice?.status === 'paid'

  const handleSubmit = async () => {
    const to = email.trim()
    if (!to) return
    await onSend({ to, updateClientEmail })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Envoyer la facture par email</DialogTitle>
      <DialogContent>
        {invoice && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Facture <strong>{invoice.number}</strong>
              {isPaid ? ' — déjà réglée : le client recevra un justificatif sans lien de paiement.' : ''}
            </Typography>
            {isPaid && (
              <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                Cette facture est marquée comme payée. L’email indiquera qu’elle a déjà été réglée.
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
