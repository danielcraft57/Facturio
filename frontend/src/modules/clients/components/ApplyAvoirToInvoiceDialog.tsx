import { useEffect, useState } from 'react'
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
  Typography,
} from '@mui/material'
import { avoirsService } from '../../../services/avoirs'
import { apiClient } from '../../../services/api'
import type { ClientFinanceAvoir, ClientFinanceData } from '../../../services/clientFinance'
import { formatCurrency } from '../../../utils/formatters'

type Props = {
  open: boolean
  onClose: () => void
  clientId: string
  finance: ClientFinanceData | null
  onApplied: () => void
}

export function ApplyAvoirToInvoiceDialog({ open, onClose, clientId, finance, onApplied }: Props) {
  const credits = (finance?.avoirs ?? []).filter((a) => a.balance > 0.01)
  const openInvoices = finance?.openInvoices ?? []

  const [avoirId, setAvoirId] = useState<number | ''>('')
  const [invoiceId, setInvoiceId] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const selectedCredit = credits.find((c) => c.id === avoirId)
  const selectedInvoice = openInvoices.find((i) => i.id === invoiceId)

  useEffect(() => {
    if (!open) return
    setError(null)
    if (credits.length === 1) setAvoirId(credits[0].id)
    if (openInvoices.length === 1) {
      setInvoiceId(openInvoices[0].id)
      setAmount(String(Math.min(credits[0]?.balance ?? openInvoices[0].balance, openInvoices[0].balance)))
    }
  }, [open, credits, openInvoices])

  useEffect(() => {
    if (!selectedCredit || !selectedInvoice) return
    const max = Math.min(selectedCredit.balance, selectedInvoice.balance)
    setAmount(String(Number(max.toFixed(2))))
  }, [avoirId, invoiceId, selectedCredit, selectedInvoice])

  const handleSubmit = async () => {
    if (!avoirId || !invoiceId || !amount) {
      setError('Sélectionnez un avoir, une facture et un montant')
      return
    }
    const num = Number(amount)
    if (!Number.isFinite(num) || num <= 0) {
      setError('Montant invalide')
      return
    }
    try {
      setSubmitting(true)
      setError(null)
      await avoirsService.apply(Number(avoirId), invoiceId, num)
      apiClient.invalidateCache(`/clients/${clientId}/finance`)
      apiClient.invalidateCache('/avoirs')
      apiClient.invalidateCache('/invoices')
      onApplied()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Imputation impossible')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Imputer un avoir sur une facture</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {credits.length === 0 && (
            <Alert severity="warning">Aucun crédit disponible pour ce client.</Alert>
          )}
          {openInvoices.length === 0 && (
            <Alert severity="warning">Aucune facture avec solde ouvert.</Alert>
          )}
          <TextField
            select
            label="Avoir / crédit"
            value={avoirId}
            onChange={(e) => setAvoirId(Number(e.target.value))}
            fullWidth
            disabled={credits.length === 0}
          >
            {credits.map((c: ClientFinanceAvoir) => (
              <MenuItem key={c.id} value={c.id}>
                {c.number} — dispo {formatCurrency(c.balance)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Facture cible"
            value={invoiceId}
            onChange={(e) => setInvoiceId(e.target.value)}
            fullWidth
            disabled={openInvoices.length === 0}
          >
            {openInvoices.map((inv) => (
              <MenuItem key={inv.id} value={inv.id}>
                {inv.number} — reste {formatCurrency(inv.balance)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Montant à imputer (TTC)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
            inputProps={{ min: 0.01, step: 0.01 }}
          />
          {selectedCredit && selectedInvoice && (
            <Typography variant="caption" color="text.secondary">
              Maximum : {formatCurrency(Math.min(selectedCredit.balance, selectedInvoice.balance))}
            </Typography>
          )}
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Annuler
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting || credits.length === 0}>
          Imputer
        </Button>
      </DialogActions>
    </Dialog>
  )
}
