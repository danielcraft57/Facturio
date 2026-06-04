import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { payablesService, type PayableDebtRow } from '../../../services/payables'
import {
  parsePayablePaymentAmount,
  validatePayablePaymentAmount,
} from '../payableDebtPaymentValidation'

type DebtPaymentTarget = {
  id: number
  label: string
  creditorName: string
  balance: number
  status: string
}

type Props = {
  open: boolean
  debt: DebtPaymentTarget | null
  onClose: () => void
  onRecorded?: (debt: PayableDebtRow, paymentAmount: number) => void | Promise<void>
}

export function RecordPayableDebtPaymentDialog({
  open,
  debt,
  onClose,
  onRecorded,
}: Props) {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('Virement')
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !debt) return
    setAmount(debt.balance > 0 ? String(debt.balance) : '')
    setMethod('Virement')
    setSubmitError(null)
  }, [open, debt])

  const parsedAmount = useMemo(() => parsePayablePaymentAmount(amount), [amount])
  const fieldError = useMemo(
    () =>
      debt
        ? validatePayablePaymentAmount(parsedAmount, debt.balance, { status: debt.status })
        : null,
    [debt, parsedAmount],
  )

  const handleSubmit = async () => {
    if (!debt || fieldError) return
    if (parsedAmount == null) return
    setSaving(true)
    setSubmitError(null)
    try {
      const updated = await payablesService.recordPayment(debt.id, {
        amount: parsedAmount,
        method: method || undefined,
      })
      await onRecorded?.(updated, parsedAmount)
      onClose()
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Erreur au paiement')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Enregistrer un remboursement</DialogTitle>
      <DialogContent>
        {debt && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {debt.creditorName} — {debt.label}
              <br />
              Reste : <strong>{debt.balance.toFixed(2).replace('.', ',')} €</strong>
            </Typography>
            {submitError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError(null)}>
                {submitError}
              </Alert>
            )}
            <Stack spacing={2}>
              <TextField
                label="Montant payé (€)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                fullWidth
                inputMode="decimal"
                autoFocus
                error={Boolean(fieldError)}
                helperText={fieldError ?? 'Maximum : reste à payer'}
              />
              <TextField
                label="Mode"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                fullWidth
              />
            </Stack>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Annuler
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleSubmit()}
          disabled={saving || Boolean(fieldError)}
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
