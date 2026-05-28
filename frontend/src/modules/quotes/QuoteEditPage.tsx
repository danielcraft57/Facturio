import { useEffect, useMemo, useState } from 'react'
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
import { Description, Edit } from '@mui/icons-material'
import { quoteService } from '../../services/quoteService'
import { clientService, parseClientsListResponse } from '../../services/clients'
import type { CreateQuoteLineData } from '../../types/quote'
import type { Quote, QuoteStatus } from '../../types/quote'
import { useProductsStore } from '../../stores/productsStore'
import { productService } from '../../services/productService'
import { useToast } from '../../components/useToast'
import { formatDate } from '../../utils/formatters'
import { financePrimaryButtonSx, financeOutlinedButtonSx } from '../../components/finance/financeStyles'
import {
  FinanceFormPageShell,
  FinanceFormSectionTitle,
  FinanceFormTotalsBox,
  financeFieldSx,
} from '../../components/finance/FinanceFormDialog'
import { EditableProductLinesTable } from '../../components/finance/EditableProductLinesTable'
import { TablePageSkeleton } from '../../components/loading/TablePageSkeleton'
import { isEntityCuid } from '../../utils/entityId'

type LineForm = CreateQuoteLineData & { taxRate: number }

type QuoteEditForm = {
  clientId: string
  expiryDate: string
  status: QuoteStatus
  lines: LineForm[]
}

const EDITABLE_STATUSES: QuoteStatus[] = ['DRAFT', 'SENT']

const STATUS_OPTIONS: { value: QuoteStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Brouillon' },
  { value: 'SENT', label: 'Envoyé' },
  { value: 'ACCEPTED', label: 'Accepté' },
  { value: 'REJECTED', label: 'Rejeté' },
  { value: 'EXPIRED', label: 'Expiré' },
]

function toDateInput(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10)
  return d.toISOString().slice(0, 10)
}

export function QuoteEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const productsStore = useProductsStore()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState<QuoteEditForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const quoteId = id ?? ''

  useEffect(() => {
    if (!isEntityCuid(quoteId)) return
    void load(quoteId)
    if (productsStore.isStale || productsStore.products.length === 0) {
      productsStore.fetchProducts()
    }
  }, [quoteId])

  const load = async (qid: string) => {
    try {
      setLoading(true)
      setError(null)
      const [q, clientsRes] = await Promise.all([
        quoteService.getQuote(qid),
        clientService.getClients({ page: 1, limit: 100 }),
      ])
      if (!EDITABLE_STATUSES.includes(q.status)) {
        setQuote(q)
        setError('Seuls les devis en brouillon ou envoyés peuvent être modifiés.')
        setForm(null)
        return
      }
      setQuote(q)
      setClients(
        parseClientsListResponse(clientsRes).map((c) => ({
          id: String(c.id),
          name: c.name,
        })),
      )
      setForm({
        clientId: q.clientId,
        expiryDate: toDateInput(q.expiryDate),
        status: q.status,
        lines: q.lines.map((ln) => ({
          productId: (ln as LineForm).productId,
          description: ln.description,
          quantity: ln.quantity,
          unitPrice: ln.unitPrice,
          taxRate: Number(ln.taxRate ?? 0.2),
        })),
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Impossible de charger le devis')
    } finally {
      setLoading(false)
    }
  }

  const totals = useMemo(() => {
    if (!form) return { subtotal: 0, tax: 0, total: 0, qty: 0 }
    const subtotal = form.lines.reduce((s, l) => s + Number(l.quantity) * Number(l.unitPrice), 0)
    const tax = form.lines.reduce(
      (s, l) => s + Number(l.quantity) * Number(l.unitPrice) * Number(l.taxRate ?? 0),
      0,
    )
    const qty = form.lines.reduce((s, l) => s + Number(l.quantity ?? 0), 0)
    return { subtotal, tax, total: subtotal + tax, qty }
  }, [form])

  const handleAddLine = () => {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            lines: [...prev.lines, { description: '', quantity: 1, unitPrice: 0, taxRate: 0.2 }],
          }
        : prev,
    )
  }

  const handleRemoveLine = (index: number) => {
    setForm((prev) => {
      if (!prev || prev.lines.length <= 1) return prev
      return { ...prev, lines: prev.lines.filter((_, i) => i !== index) }
    })
  }

  const handleLineChange = (
    index: number,
    field: keyof LineForm,
    value: string | number,
  ) => {
    setForm((prev) => {
      if (!prev) return prev
      const lines = [...prev.lines]
      const line = { ...lines[index] }
      if (field === 'quantity' || field === 'unitPrice' || field === 'taxRate') {
        line[field] = Number(value)
      } else if (field === 'description') {
        line.description = String(value)
      } else if (field === 'productId') {
        line.productId = Number(value)
      }
      lines[index] = line
      return { ...prev, lines }
    })
  }

  const handleSave = async () => {
    if (!isEntityCuid(quoteId) || !form) return
    if (form.clientId === '' || form.lines.some((l) => !l.description.trim())) {
      toast.error('Client et descriptions des lignes sont obligatoires.')
      return
    }
    try {
      setSaving(true)
      const existingNames = new Set(
        productsStore.products.map((p) => (p.description ?? p.name ?? '').trim().toLowerCase()),
      )
      const productCandidates = form.lines
        .map((line) => ({
          name: line.description.trim(),
          unitPrice: Number(line.unitPrice),
        }))
        .filter((line) => line.name.length > 0 && !existingNames.has(line.name.toLowerCase()))

      for (const candidate of productCandidates) {
        try {
          await productService.createProduct({
            name: candidate.name,
            description: candidate.name,
            unitPrice: candidate.unitPrice > 0 ? candidate.unitPrice : undefined,
          })
          existingNames.add(candidate.name.toLowerCase())
        } catch {
          // On laisse la sauvegarde du devis continuer même si la création produit échoue.
        }
      }

      await quoteService.updateQuote(quoteId, {
        clientId: form.clientId,
        expiryDate: form.expiryDate || undefined,
        status: form.status,
        lines: form.lines.map(({ productId, description, quantity, unitPrice, taxRate }) => ({
          productId: productId ?? undefined,
          description: description.trim(),
          quantity: Number(quantity),
          unitPrice: Number(unitPrice),
          taxRate: Number(taxRate),
        })),
      })
      toast.success('Devis mis à jour')
      navigate(`/devis/inbox?quoteId=${quoteId}`)
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
        <Button
          sx={financeOutlinedButtonSx}
          onClick={() => navigate(quote ? `/devis/inbox?quoteId=${quoteId}` : '/devis/inbox')}
        >
          Retour
        </Button>
      </Box>
    )
  }

  if (!form || !quote) return null

  return (
    <FinanceFormPageShell
      title={`Modifier ${quote.number}`}
      subtitle={`Créé le ${formatDate(quote.date)} — TVA en décimal (0,2 = 20 %)`}
      icon={<Edit />}
      backLabel="Annuler"
      onBack={() => navigate(`/devis/inbox?quoteId=${quoteId}`)}
      actions={
        <>
          <Button
            disabled={saving}
            onClick={() => navigate(`/devis/inbox?quoteId=${quoteId}`)}
            sx={financeOutlinedButtonSx}
          >
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
            <Description fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              N° {quote.number} — date d&apos;émission non modifiable ({formatDate(quote.date)})
            </Typography>
          </Stack>
        </Box>

        <Box>
          <FinanceFormSectionTitle>Client &amp; statut</FinanceFormSectionTitle>
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
                onChange={(e) =>
                  setForm((p) => (p ? { ...p, clientId: e.target.value as string } : p))
                }
              >
                {clients.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={financeFieldSx}>
              <InputLabel>Statut</InputLabel>
              <Select
                label="Statut"
                value={form.status}
                onChange={(e) =>
                  setForm((p) => (p ? { ...p, status: e.target.value as QuoteStatus } : p))
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
          <FinanceFormSectionTitle>Validité</FinanceFormSectionTitle>
          <TextField
            fullWidth
            label="Date limite de validité"
            type="date"
            value={form.expiryDate}
            onChange={(e) => setForm((p) => (p ? { ...p, expiryDate: e.target.value } : p))}
            InputLabelProps={{ shrink: true }}
            sx={financeFieldSx}
          />
        </Box>

        <EditableProductLinesTable
          title="Lignes"
          addLabel="Ligne vide"
          lines={form.lines.map((line) => ({
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            taxRate: line.taxRate ?? 0.2,
          }))}
          products={productsStore.products}
          taxHeader="TVA (0-1)"
          taxInputProps={{ min: 0, max: 1, step: 0.01 }}
          quantityWidth={70}
          unitPriceWidth={100}
          taxWidth={80}
          onAddLine={handleAddLine}
          onRemoveLine={handleRemoveLine}
          onLineChange={handleLineChange}
        />

        <FinanceFormTotalsBox
          rows={[
            { label: 'Total qté / heures', value: String(totals.qty) },
            { label: 'Total HT', value: `${totals.subtotal.toFixed(2)} €` },
            { label: 'TVA', value: `${totals.tax.toFixed(2)} €` },
          ]}
          totalLabel="Total TTC"
          totalValue={`${totals.total.toFixed(2)} €`}
        />
      </Stack>
    </FinanceFormPageShell>
  )
}
