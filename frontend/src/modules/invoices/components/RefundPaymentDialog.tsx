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
} from '@mui/material'
import { formatCurrency } from '../../../utils/formatters'

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

  const handleClose = () => {
    if (!loading) onClose()
  }

  const handleSubmit = async () => {
    if (amount <= 0 || amount > maxAmount) return
    setLoading(true)
    try {
      await onSubmit({
        amount,
        reason: reason.trim() || undefined,
        refundViaStripe: isStripe ? refundViaStripe : false,
      })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Rembourser le paiement #{paymentId}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Alert severity="info">
            Montant remboursable sur ce paiement : {formatCurrency(maxAmount)}
          </Alert>
          <TextField
            label="Montant à rembourser"
            type="number"
            fullWidth
            value={amount}
            onChange={(e) => setAmount(Math.min(maxAmount, Math.max(0, Number(e.target.value))))}
            inputProps={{ min: 0.01, max: maxAmount, step: 0.01 }}
          />
          <TextField
            label="Motif (optionnel)"
            fullWidth
            multiline
            minRows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          {isStripe && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={refundViaStripe}
                  onChange={(e) => setRefundViaStripe(e.target.checked)}
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
          onClick={handleSubmit}
          disabled={loading || amount <= 0 || amount > maxAmount}
        >
          Confirmer le remboursement
        </Button>
      </DialogActions>
    </Dialog>
  )
}
