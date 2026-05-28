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
} from '@mui/material'
import { clientFinanceService } from '../../../services/clientFinance'

type Props = {
  open: boolean
  onClose: () => void
  clientId: string
  onCreated: () => void
}

export function CreateClientCreditDialog({ open, onClose, clientId, onCreated }: Props) {
  const [label, setLabel] = useState('Crédit commercial')
  const [amountTtc, setAmountTtc] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    const amount = Number(amountTtc)
    if (!label.trim() || !Number.isFinite(amount) || amount <= 0) {
      setError('Libellé et montant TTC requis')
      return
    }
    try {
      setSubmitting(true)
      setError(null)
      await clientFinanceService.createCredit(clientId, {
        label: label.trim(),
        amountTtc: amount,
        notes: notes.trim() || undefined,
      })
      onCreated()
      onClose()
      setAmountTtc('')
      setNotes('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Création impossible')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Créer un crédit client</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Alert severity="info">
            Génère un avoir non lié à une facture, imputable ensuite sur les factures ouvertes du client.
          </Alert>
          <TextField label="Libellé" value={label} onChange={(e) => setLabel(e.target.value)} fullWidth />
          <TextField
            label="Montant TTC"
            type="number"
            value={amountTtc}
            onChange={(e) => setAmountTtc(e.target.value)}
            fullWidth
            inputProps={{ min: 0.01, step: 0.01 }}
          />
          <TextField
            label="Notes (optionnel)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Annuler
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
          Créer le crédit
        </Button>
      </DialogActions>
    </Dialog>
  )
}
