import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Alert,
} from '@mui/material'
import { clientFinanceService } from '../../../services/clientFinance'

const KINDS = [
  { value: 'adjustment', label: 'Ajustement' },
  { value: 'goodwill', label: 'Geste commercial' },
  { value: 'fee', label: 'Frais / pénalité (crédit)' },
  { value: 'other', label: 'Autre' },
] as const

type Props = {
  open: boolean
  onClose: () => void
  clientId: string
  onCreated: () => void
}

export function CreateClientMiscOperationDialog({ open, onClose, clientId, onCreated }: Props) {
  const [label, setLabel] = useState('')
  const [amountTtc, setAmountTtc] = useState('')
  const [kind, setKind] = useState<string>('other')
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
      await clientFinanceService.createMiscOperation(clientId, {
        label: label.trim(),
        amountTtc: amount,
        kind,
        notes: notes.trim() || undefined,
      })
      onCreated()
      onClose()
      setLabel('')
      setAmountTtc('')
      setNotes('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Opération impossible')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Opération diverse</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Alert severity="info">
            Enregistre un avoir marqué « opération diverse » (traçabilité comptable via le module Avoirs).
          </Alert>
          <TextField label="Libellé" value={label} onChange={(e) => setLabel(e.target.value)} fullWidth />
          <TextField select label="Type" value={kind} onChange={(e) => setKind(e.target.value)} fullWidth>
            {KINDS.map((k) => (
              <MenuItem key={k.value} value={k.value}>
                {k.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Montant TTC (crédit client)"
            type="number"
            value={amountTtc}
            onChange={(e) => setAmountTtc(e.target.value)}
            fullWidth
            inputProps={{ min: 0.01, step: 0.01 }}
          />
          <TextField
            label="Notes"
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
          Enregistrer
        </Button>
      </DialogActions>
    </Dialog>
  )
}
