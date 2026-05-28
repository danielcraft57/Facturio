import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Alert,
  FormControlLabel,
  Checkbox,
  Typography,
} from '@mui/material'

interface CancelDepositDialogProps {
  open: boolean
  onClose: () => void
  invoiceNumber: string
  hasStripePayments?: boolean
  onSubmit: (payload: { reason?: string; refundViaStripe?: boolean; creditOnly?: boolean }) => Promise<void>
}

export function CancelDepositDialog({
  open,
  onClose,
  invoiceNumber,
  hasStripePayments,
  onSubmit,
}: CancelDepositDialogProps) {
  const [reason, setReason] = useState('Annulation du contrat d\'engagement — remboursement acompte')
  const [refundViaStripe, setRefundViaStripe] = useState(Boolean(hasStripePayments))
  const [creditOnly, setCreditOnly] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleClose = () => {
    if (!loading) onClose()
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await onSubmit({
        reason: reason.trim() || undefined,
        refundViaStripe: hasStripePayments && !creditOnly ? refundViaStripe : false,
        creditOnly,
      })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Annuler l&apos;acompte — {invoiceNumber}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Alert severity="warning">
            Cette action annule le contrat d&apos;engagement.
            <br />
            - Mode remboursement : rembourse l&apos;acompte encaissé, émet un avoir, et annule la facture de solde (si non payée).
            <br />
            - Mode crédit : émet un avoir (crédit client) à imputer sur une prochaine facture, sans sortie banque.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Conforme au droit de rétractation / annulation avant exécution du solde.
          </Typography>
          <TextField
            label="Motif"
            fullWidth
            multiline
            minRows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={creditOnly}
                onChange={(e) => setCreditOnly(e.target.checked)}
              />
            }
            label="Créer un avoir (crédit client) au lieu de rembourser"
          />
          {hasStripePayments && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={refundViaStripe}
                  onChange={(e) => setRefundViaStripe(e.target.checked)}
                  disabled={creditOnly}
                />
              }
              label="Rembourser l'acompte via Stripe"
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Retour
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleSubmit}
          disabled={loading}
        >
          Annuler le contrat et rembourser
        </Button>
      </DialogActions>
    </Dialog>
  )
}
