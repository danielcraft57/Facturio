import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  IconButton,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  alpha,
} from '@mui/material'
import { Add, Delete, Edit, ReceiptLong } from '@mui/icons-material'
import {
  invoiceService,
  normalizeInvoiceFromApi,
  unwrapApiPayload,
  type Invoice,
  type UpdateInvoiceData,
} from '../../services/invoices'
import { clientService, parseClientsListResponse } from '../../services/clients'
import type { Client } from '../../services/clients'
import { useToast } from '../../components/useToast'
import { apiClient } from '../../services/api'
import { formatDate } from '../../utils/formatters'
import { financePrimaryButtonSx, financeOutlinedButtonSx } from '../../components/finance/financeStyles'
import {
  FinanceFormPageShell,
  FinanceFormSectionTitle,
  FinanceFormTotalsBox,
  financeFieldSx,
} from '../../components/finance/FinanceFormDialog'
import { TablePageSkeleton } from '../../components/loading/TablePageSkeleton'

type LineForm = {
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
}

type InvoiceEditForm = {
  clientId: string
  dueDate: string
  currency: string
  status: Invoice['status']
  items: LineForm[]
}

const STATUS_OPTIONS: { value: Invoice['status']; label: string }[] = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'sent', label: 'Envoyée' },
  { value: 'paid', label: 'Payée' },
  { value: 'overdue', label: 'En retard' },
  { value: 'cancelled', label: 'Annulée' },
]

function toDateInput(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10)
  return d.toISOString().slice(0, 10)
}

export function InvoiceEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [form, setForm] = useState<InvoiceEditForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    void load(id)
  }, [id])

  const load = async (invoiceId: string) => {
    try {
      setLoading(true)
      setError(null)
      apiClient.invalidateCache(`/invoices/${invoiceId}`)
      const [invRes, clientsRes] = await Promise.all([
        invoiceService.getInvoice(invoiceId),
        clientService.getClients({ page: 1, limit: 100 }),
      ])
      const raw = unwrapApiPayload<Record<string, unknown>>(invRes)
      const inv = normalizeInvoiceFromApi(raw)
      if (inv.status !== 'draft') {
        setError('Seules les factures en brouillon peuvent être modifiées.')
        setInvoice(inv)
        setForm(null)
        return
      }
      setInvoice(inv)
      setClients(parseClientsListResponse(clientsRes))
      setForm({
        clientId: inv.clientId,
        dueDate: toDateInput(inv.dueDate),
        currency: inv.currency || 'EUR',
        status: inv.status,
        items: inv.items.map((it) => ({
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          taxRate: it.taxRate,
        })),
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Impossible de charger la facture')
    } finally {
      setLoading(false)
    }
  }

  const totals = useMemo(() => {
    if (!form) return { subtotal: 0, taxTotal: 0, total: 0 }
    const subtotal = form.items.reduce((s, it) => s + it.quantity * it.unitPrice, 0)
    const taxTotal = form.items.reduce((s, it) => {
      const base = it.quantity * it.unitPrice
      return s + base * (it.taxRate / 100)
    }, 0)
    return { subtotal, taxTotal, total: subtotal + taxTotal }
  }, [form])

  const currencySymbol =
    form?.currency === 'USD' ? '$' : form?.currency === 'GBP' ? '£' : '€'

  const handleAddItem = () => {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, taxRate: 20 }],
          }
        : prev,
    )
  }

  const handleRemoveItem = (index: number) => {
    setForm((prev) => {
      if (!prev || prev.items.length <= 1) return prev
      return { ...prev, items: prev.items.filter((_, i) => i !== index) }
    })
  }

  const handleItemChange = (index: number, field: keyof LineForm, value: string | number) => {
    setForm((prev) => {
      if (!prev) return prev
      const items = [...prev.items]
      items[index] = { ...items[index], [field]: value }
      return { ...prev, items }
    })
  }

  const handleSave = async () => {
    if (!id || !form) return
    if (!form.clientId || form.items.some((it) => !it.description.trim() || it.unitPrice <= 0)) {
      toast.error('Client, descriptions et prix unitaires sont obligatoires.')
      return
    }
    try {
      setSaving(true)
      const payload: UpdateInvoiceData = {
        id,
        clientId: form.clientId,
        dueDate: form.dueDate,
        currency: form.currency,
        status: form.status,
        items: form.items,
      }
      await invoiceService.updateInvoice(payload)
      toast.success('Facture mise à jour')
      navigate(`/factures/${id}`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Enregistrement impossible')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <TablePageSkeleton rows={6} />
      </Box>
    )
  }

  if (error && !form) {
    return (
      <Box sx={{ p: 3, maxWidth: 720, mx: 'auto' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button sx={financeOutlinedButtonSx} onClick={() => navigate(invoice ? `/factures/${id}` : '/factures/inbox')}>
          Retour
        </Button>
      </Box>
    )
  }

  if (!form || !invoice) return null

  return (
    <FinanceFormPageShell
      title={`Modifier ${invoice.number}`}
      subtitle={`Émission ${formatDate(invoice.issueDate)} — brouillon modifiable`}
      icon={<Edit />}
      backLabel="Annuler"
      onBack={() => navigate(`/factures/${id}`)}
      actions={
        <>
          <Button disabled={saving} onClick={() => navigate(`/factures/${id}`)} sx={financeOutlinedButtonSx}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={financePrimaryButtonSx}
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </>
      }
    >
      <Stack spacing={2.5}>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: (t) => alpha('#0f172a', t.palette.mode === 'dark' ? 0.15 : 0.04),
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <ReceiptLong fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              N° {invoice.number} — émission non modifiable ({formatDate(invoice.issueDate)})
            </Typography>
          </Stack>
        </Box>

        <Box>
          <FinanceFormSectionTitle>Client &amp; paramètres</FinanceFormSectionTitle>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
            }}
          >
            <FormControl fullWidth required sx={financeFieldSx}>
              <InputLabel>Client</InputLabel>
              <Select
                label="Client"
                value={form.clientId}
                onChange={(e) => setForm((p) => (p ? { ...p, clientId: e.target.value } : p))}
              >
                {clients.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                    {c.email ? ` — ${c.email}` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Devise"
              select
              value={form.currency}
              onChange={(e) => setForm((p) => (p ? { ...p, currency: e.target.value } : p))}
              sx={financeFieldSx}
            >
              <MenuItem value="EUR">EUR (€)</MenuItem>
              <MenuItem value="USD">USD ($)</MenuItem>
              <MenuItem value="GBP">GBP (£)</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="Date d'échéance"
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((p) => (p ? { ...p, dueDate: e.target.value } : p))}
              InputLabelProps={{ shrink: true }}
              sx={financeFieldSx}
            />
            <FormControl fullWidth sx={financeFieldSx}>
              <InputLabel>Statut</InputLabel>
              <Select
                label="Statut"
                value={form.status}
                onChange={(e) =>
                  setForm((p) => (p ? { ...p, status: e.target.value as Invoice['status'] } : p))
                }
              >
                {STATUS_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        <Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
            <FinanceFormSectionTitle sx={{ mb: 0 }}>Lignes</FinanceFormSectionTitle>
            <Button size="small" startIcon={<Add />} onClick={handleAddItem} sx={financeOutlinedButtonSx}>
              Ajouter une ligne
            </Button>
          </Stack>
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ borderRadius: 2, borderColor: (t) => alpha('#0f172a', t.palette.mode === 'dark' ? 0.2 : 0.1) }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Qté</TableCell>
                  <TableCell align="right">Prix unit.</TableCell>
                  <TableCell align="right">TVA (%)</TableCell>
                  <TableCell width={48} />
                </TableRow>
              </TableHead>
              <TableBody>
                {form.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        sx={financeFieldSx}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        sx={{ width: 72, ...financeFieldSx }}
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, 'quantity', parseInt(e.target.value, 10) || 0)
                        }
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        sx={{ width: 96, ...financeFieldSx }}
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)
                        }
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        sx={{ width: 72, ...financeFieldSx }}
                        value={item.taxRate}
                        onChange={(e) =>
                          handleItemChange(index, 'taxRate', parseFloat(e.target.value) || 0)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="error"
                        disabled={form.items.length <= 1}
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <FinanceFormTotalsBox
          rows={[
            { label: 'Sous-total HT', value: `${totals.subtotal.toFixed(2)} ${currencySymbol}` },
            { label: 'TVA', value: `${totals.taxTotal.toFixed(2)} ${currencySymbol}` },
          ]}
          totalLabel="Total TTC"
          totalValue={`${totals.total.toFixed(2)} ${currencySymbol}`}
        />
      </Stack>
    </FinanceFormPageShell>
  )
}
