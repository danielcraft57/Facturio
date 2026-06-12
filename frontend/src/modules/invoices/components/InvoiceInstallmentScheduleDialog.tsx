import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import {
  invoiceInstallmentsService,
  type InvoiceInstallment,
  type InvoiceInstallmentInput,
} from '../../../services/invoiceInstallments'
import { formatCurrency, formatDate } from '../../../utils/formatters'

type Props = {
  open: boolean
  onClose: () => void
  invoiceId: string
  invoiceTotal: number
  existing: InvoiceInstallment[]
  canEdit: boolean
  onSaved: (rows: InvoiceInstallment[]) => void
}

/**
 * Dialogue de configuration d'un échéancier métier (paiement en plusieurs fois B2B).
 * Permet génération en parts égales puis édition manuelle des montants et dates.
 */
export function InvoiceInstallmentScheduleDialog({
  open,
  onClose,
  invoiceId,
  invoiceTotal,
  existing,
  canEdit,
  onSaved,
}: Props) {
  const [count, setCount] = useState(3)
  const [firstDueDate, setFirstDueDate] = useState('')
  const [intervalMonths, setIntervalMonths] = useState(1)
  const [rows, setRows] = useState<InvoiceInstallmentInput[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showGenerator, setShowGenerator] = useState(true)

  useEffect(() => {
    if (!open) return
    setError(null)
    if (existing.length > 0) {
      setRows(
        existing.map((r) => ({
          amount: r.amount,
          dueDate: r.dueDate.slice(0, 10),
        })),
      )
      setShowGenerator(false)
    } else {
      const defaultDue = new Date()
      defaultDue.setMonth(defaultDue.getMonth() + 1)
      setFirstDueDate(defaultDue.toISOString().slice(0, 10))
      setCount(3)
      setRows([])
      setShowGenerator(true)
    }
  }, [open, existing])

  const previewSum = useMemo(() => rows.reduce((s, r) => s + Number(r.amount || 0), 0), [rows])
  const sumDelta = useMemo(() => Number((invoiceTotal - previewSum).toFixed(2)), [invoiceTotal, previewSum])

  const updateRow = (index: number, patch: Partial<InvoiceInstallmentInput>) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    )
  }

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  const handlePreview = async () => {
    if (!firstDueDate) {
      setError('Indiquez la date de la première échéance')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const preview = await invoiceInstallmentsService.previewEqual(
        invoiceId,
        invoiceTotal,
        count,
        firstDueDate,
        intervalMonths,
      )
      setRows(preview)
      setShowGenerator(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Impossible de calculer l'échéancier")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (rows.length < 2) {
      setError('Au moins 2 échéances requises')
      return
    }
    if (Math.abs(sumDelta) > 0.02) {
      setError(
        `La somme (${formatCurrency(previewSum)}) doit égaler le total TTC (${formatCurrency(invoiceTotal)})`,
      )
      return
    }
    setLoading(true)
    setError(null)
    try {
      const saved = await invoiceInstallmentsService.setSchedule(invoiceId, rows)
      onSaved(saved)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = async () => {
    setLoading(true)
    setError(null)
    try {
      await invoiceInstallmentsService.clear(invoiceId)
      onSaved([])
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Suppression impossible')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Paiement en plusieurs fois</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Total facture : {formatCurrency(invoiceTotal)}. Ajustez les montants et dates après le
          calcul automatique si besoin.
        </Typography>

        {!canEdit && (
          <Alert severity="info" sx={{ mb: 2 }}>
            L'échéancier ne peut plus être modifié après un encaissement.
          </Alert>
        )}

        {canEdit && showGenerator && (
          <Stack spacing={2} sx={{ mb: 2 }}>
            <TextField
              select
              label="Nombre d'échéances"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              fullWidth
            >
              {[2, 3, 4, 6, 12].map((n) => (
                <MenuItem key={n} value={n}>
                  {n} fois
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Première échéance"
              type="date"
              value={firstDueDate}
              onChange={(e) => setFirstDueDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              select
              label="Intervalle"
              value={intervalMonths}
              onChange={(e) => setIntervalMonths(Number(e.target.value))}
              fullWidth
            >
              <MenuItem value={1}>Chaque mois</MenuItem>
              <MenuItem value={2}>Tous les 2 mois</MenuItem>
              <MenuItem value={3}>Tous les 3 mois</MenuItem>
            </TextField>
            <Button variant="outlined" onClick={handlePreview} disabled={loading}>
              Calculer les échéances égales
            </Button>
          </Stack>
        )}

        {canEdit && !showGenerator && rows.length > 0 && (
          <Button size="small" sx={{ mb: 1 }} onClick={() => setShowGenerator(true)}>
            Recalculer en parts égales
          </Button>
        )}

        {rows.length > 0 && (
          <Stack spacing={1.5}>
            {rows.map((row, index) => (
              <Stack
                key={`installment-row-${index}`}
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                alignItems={{ sm: 'center' }}
                sx={{
                  p: 1.5,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" fontWeight={600} sx={{ minWidth: 88 }}>
                  Échéance {index + 1}
                </Typography>
                {canEdit ? (
                  <>
                    <TextField
                      label="Montant (€)"
                      type="number"
                      size="small"
                      value={row.amount}
                      onChange={(e) =>
                        updateRow(index, { amount: Number(e.target.value) || 0 })
                      }
                      inputProps={{ min: 0.01, step: 0.01 }}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label="Date"
                      type="date"
                      size="small"
                      value={row.dueDate}
                      onChange={(e) => updateRow(index, { dueDate: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      sx={{ flex: 1 }}
                    />
                    {rows.length > 2 && (
                      <IconButton
                        aria-label="Supprimer cette échéance"
                        color="error"
                        onClick={() => removeRow(index)}
                        size="small"
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    )}
                  </>
                ) : (
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {formatCurrency(row.amount)} · {formatDate(row.dueDate)}
                  </Typography>
                )}
              </Stack>
            ))}
            <Stack direction="row" justifyContent="space-between" sx={{ px: 0.5, pt: 0.5 }}>
              <Typography variant="body2" fontWeight={700}>
                Total échéances
              </Typography>
              <Typography
                variant="body2"
                fontWeight={700}
                color={Math.abs(sumDelta) > 0.02 ? 'error.main' : 'success.main'}
              >
                {formatCurrency(previewSum)}
                {Math.abs(sumDelta) > 0.02 && ` (${sumDelta > 0 ? '+' : ''}${formatCurrency(sumDelta)})`}
              </Typography>
            </Stack>
          </Stack>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        {existing.length > 0 && canEdit && (
          <Button color="error" onClick={handleClear} disabled={loading}>
            Supprimer l'échéancier
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose}>Fermer</Button>
        {canEdit && rows.length >= 2 && (
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loading || Math.abs(sumDelta) > 0.02}
          >
            Enregistrer
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
