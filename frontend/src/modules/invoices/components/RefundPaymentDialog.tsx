import { useEffect, useState } from 'react'
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
} from '@mui/material'
import { formatCurrency } from '../../../utils/formatters'
import { getErrorMessage } from '../../../services/api'

interface RefundPaymentDialogProps {
  open: boolean
  onClose: () => void
  paymentId: number
  maxAmount: number
  isStripe?: boolean
  onSubmit: (payload: {
    amount: number
    reason?: string
    refundViaStripe?: boolean
  }) => Promise<void>
}

/**
 * Dialogue de remboursement d'un paiement (manuel ou via Stripe).
 * Affiche les erreurs API/Stripe dans le dialogue sans le fermer.
 */
export function RefundPaymentDialog({
  open,
  onClose,
  paymentId,
  maxAmount,
  isStripe,
  onSubmit,
}: RefundPaymentDialogProps) {
  const [amount, setAmount] = useState(maxAmount)
  const [reason, setReason] = useState('')
  const [refundViaStripe, setRefundViaStripe] = useState(Boolean(isStripe))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setAmount(maxAmount)
      setReason('')
      setRefundViaStripe(Boolean(isStripe))
      setError(null)
      setLoading(false)
    }
  }, [open, maxAmount, isStripe])

  const handleClose = () => {
    if (!loading) onClose()
  }

  const handleSubmit = async () => {
    if (amount <= 0 || amount > maxAmount) return
    setLoading(true)
    setError(null)
    try {
      await onSubmit({
        amount,
        reason: reason.trim() || undefined,
        refundViaStripe: isStripe ? refundViaStripe : false,
      })
      onClose()
    } catch (err: unknown) {
      setError(
        getErrorMessage(
          err,
          isStripe
            ? 'Remboursement Stripe impossible. Vérifiez les clés Stripe et le statut du paiement.'
            : 'Remboursement impossible',
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Rembourser le paiement #{paymentId}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Alert severity="info">
            Montant remboursable sur ce paiement : {formatCurrency(maxAmount)}
            {isStripe
              ? ' - avec Stripe, l\'argent est renvoyé sur le moyen de paiement du client.'
              : ''}
          </Alert>
          <TextField
            label="Montant à rembourser"
            type="number"
            fullWidth
            value={amount}
            onChange={(e) => {
              const raw = Number(e.target.value)
              const rounded = Math.round(Math.min(maxAmount, Math.max(0, raw)) * 100) / 100
              setAmount(rounded)
            }}
            inputProps={{ min: 0.01, max: maxAmount, step: 0.01 }}
            disabled={loading}
          />
          <TextField
            label="Motif (optionnel)"
            fullWidth
            multiline
            minRows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, 500))}
            inputProps={{ maxLength: 500 }}
            disabled={loading}
          />
          {isStripe && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={refundViaStripe}
                  onChange={(e) => setRefundViaStripe(e.target.checked)}
                  disabled={loading}
                />
              }
              label="Rembourser via Stripe (carte bancaire)"
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Annuler
        </Button>
        <Button
          variant="contained"
          color="warning"
          onClick={() => void handleSubmit()}
          disabled={loading || amount <= 0 || amount > maxAmount}
        >
          {loading ? 'Remboursement…' : 'Confirmer le remboursement'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
