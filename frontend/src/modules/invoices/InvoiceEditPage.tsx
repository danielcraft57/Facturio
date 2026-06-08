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
  Select,
  Stack,
  TextField,
  Typography,
  alpha,
} from '@mui/material'
import { Edit, ReceiptLong } from '@mui/icons-material'
import {
  invoiceService,
  type Invoice,
  type UpdateInvoiceData,
} from '../../services/invoices'
import { clientService, parseClientsListResponse } from '../../services/clients'
import type { Client } from '../../services/clients'
import { useProductsStore } from '../../stores/productsStore'
import { productService } from '../../services/productService'
import { suggestProductSkuFromName } from '../products/utils/productSku'
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
import { EditableProductLinesTable } from '../../components/finance/EditableProductLinesTable'
import {
  applyProductLineFieldChange,
  ensureTrailingEmptyLine,
  filterProductLinesForSubmit,
  removeProductLine,
} from '../../components/finance/editableProductLinesUtils'
import { TablePageSkeleton } from '../../components/loading/TablePageSkeleton'

type LineForm = {
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  productId?: number | null
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
  const productsStore = useProductsStore()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [form, setForm] = useState<InvoiceEditForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void productService.prefetchCatalog(100)
  }, [])

  useEffect(() => {
    if (!id) return
    void load(id)
    if (productsStore.isStale || productsStore.products.length === 0) {
      productsStore.fetchProducts()
    }
  }, [id])

  const load = async (invoiceId: string) => {
    try {
      setLoading(true)
      setError(null)
      apiClient.invalidateCache(`/invoices/${invoiceId}`)
      const [inv, clientsRes] = await Promise.all([
        invoiceService.getInvoice(invoiceId),
        clientService.getClients({ page: 1, limit: 100 }),
      ])
      if (inv.status !== 'draft') {
        setError('Seules les factures en brouillon peuvent être modifiées.')
        setInvoice(inv)
        setForm(null)
        return
      }
      setInvoice(inv)
      setClients(parseClientsListResponse(clientsRes))
      const createEmptyItem = (): LineForm => ({
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: 20,
      })
      setForm({
        clientId: inv.clientId,
        dueDate: toDateInput(inv.dueDate),
        currency: inv.currency || 'EUR',
        status: inv.status,
        items: ensureTrailingEmptyLine(
          inv.items.map((it) => ({
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            taxRate: it.taxRate,
          })),
          createEmptyItem,
        ),
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Impossible de charger la facture')
    } finally {
      setLoading(false)
    }
  }

  const createEmptyItem = (): LineForm => ({
    description: '',
    quantity: 1,
    unitPrice: 0,
    taxRate: 20,
  })

  const totals = useMemo(() => {
    if (!form) return { subtotal: 0, taxTotal: 0, total: 0 }
    const active = filterProductLinesForSubmit(form.items)
    const subtotal = active.reduce((s, it) => s + 1 * it.unitPrice, 0)
    const taxTotal = active.reduce((s, it) => {
      const base = 1 * it.unitPrice
      return s + base * (it.taxRate / 100)
    }, 0)
    return { subtotal, taxTotal, total: subtotal + taxTotal }
  }, [form])

  const currencySymbol =
    form?.currency === 'USD' ? '$' : form?.currency === 'GBP' ? '£' : '€'

  const handleRemoveItem = (index: number) => {
    setForm((prev) =>
      prev ? { ...prev, items: removeProductLine(prev.items, index, createEmptyItem) } : prev,
    )
  }

  const handleItemChange = (index: number, field: keyof LineForm, value: string | number) => {
    setForm((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        items: applyProductLineFieldChange(
          prev.items,
          index,
          (item) => {
            if (field === 'quantity') {
              item.quantity = 1
            } else if (field === 'unitPrice') {
              item.unitPrice = Math.round(Number(value) || 0)
            } else {
              item[field] = value as never
            }
            return item
          },
          createEmptyItem,
        ),
      }
    })
  }

  const handleSave = async () => {
    if (!id || !form) return
    const filledItems = filterProductLinesForSubmit(form.items)
    if (!form.clientId || filledItems.length === 0 || filledItems.some((it) => it.unitPrice < 0)) {
      toast.error('Client, au moins une ligne et prix unitaires valides sont obligatoires.')
      return
    }
    try {
      setSaving(true)
      const existingNames = new Set(
        productsStore.products.map((p) => (p.description ?? p.name ?? '').trim().toLowerCase()),
      )
      const productCandidates = filledItems
        .map((line) => ({
          name: line.description.trim(),
          unitPrice: Number(line.unitPrice),
        }))
        .filter((line) => line.name.length > 0 && !existingNames.has(line.name.toLowerCase()))

      for (const candidate of productCandidates) {
        try {
          await productService.createProduct({
            name: candidate.name,
            sku: suggestProductSkuFromName(candidate.name),
            description: candidate.name,
            unitPrice: candidate.unitPrice > 0 ? candidate.unitPrice : undefined,
          })
          existingNames.add(candidate.name.toLowerCase())
        } catch {
          // On laisse la sauvegarde de la facture continuer même si la création produit échoue.
        }
      }

      const payload: UpdateInvoiceData = {
        id,
        clientId: form.clientId,
        dueDate: form.dueDate,
        currency: form.currency,
        status: form.status,
        items: filledItems.map((it) => ({
          ...it,
          quantity: 1,
          unitPrice: Math.round(Number(it.unitPrice) || 0),
        })),
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

        <EditableProductLinesTable
          lines={form.items}
          products={productsStore.products}
          taxHeader="TVA (%)"
          onRemoveLine={handleRemoveItem}
          onLineChange={(index, field, value) => {
            if (field === 'quantity' || field === 'unitPrice' || field === 'taxRate') {
              handleItemChange(index, field, Number(value) || 0)
              return
            }
            handleItemChange(index, field, value)
          }}
        />

        <FinanceFormTotalsBox
          rows={[
            { label: 'Sous-total HT', value: `${Math.round(totals.subtotal).toFixed(0)} ${currencySymbol}` },
            { label: 'TVA', value: `${Math.round(totals.taxTotal).toFixed(0)} ${currencySymbol}` },
          ]}
          totalLabel="Total TTC"
          totalValue={`${Math.round(totals.total).toFixed(0)} ${currencySymbol}`}
        />
      </Stack>
    </FinanceFormPageShell>
  )
}
