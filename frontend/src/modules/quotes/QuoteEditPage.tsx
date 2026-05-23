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
import { Add, Delete, Description, Edit, ShoppingCart } from '@mui/icons-material'
import { quoteService } from '../../services/quoteService'
import { clientService, parseClientsListResponse } from '../../services/clients'
import type { CreateQuoteLineData } from '../../types/quote'
import type { Quote, QuoteStatus } from '../../types/quote'
import { useProductsStore } from '../../stores/productsStore'
import { useToast } from '../../components/useToast'
import { formatDate } from '../../utils/formatters'
import { financePrimaryButtonSx, financeOutlinedButtonSx } from '../../components/finance/financeStyles'
import {
  FinanceFormPageShell,
  FinanceFormSectionTitle,
  FinanceFormTotalsBox,
  financeFieldSx,
} from '../../components/finance/FinanceFormDialog'
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
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('')
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

  const handleAddProductAsLine = () => {
    if (selectedProductId === '') return
    const product = productsStore.products.find(
      (p: { id: number | string }) => Number(p.id) === Number(selectedProductId),
    )
    if (!product) return
    const unitPrice = Number(
      (product as { unitPrice?: number; unit_price?: number }).unitPrice ??
        (product as { unit_price?: number }).unit_price ??
        0,
    )
    const description =
      String(
        (product as { description?: string; name?: string }).description ??
          (product as { name?: string }).name ??
          '',
      ).trim() || (product as { name?: string }).name
    const newLine: LineForm = {
      productId: Number((product as { id: number | string }).id),
      description: description ?? '',
      quantity: 1,
      unitPrice,
      taxRate: 0.2,
    }
    setForm((prev) => {
      if (!prev) return prev
      const isSingleEmptyLine =
        prev.lines.length === 1 &&
        !String(prev.lines[0].description ?? '').trim() &&
        Number(prev.lines[0].unitPrice ?? 0) === 0
      if (isSingleEmptyLine) return { ...prev, lines: [newLine] }
      return { ...prev, lines: [...prev.lines, newLine] }
    })
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

        <Box>
          <FinanceFormSectionTitle>Catalogue produits</FinanceFormSectionTitle>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 260, flex: 1, ...financeFieldSx }}>
              <InputLabel>Produit</InputLabel>
              <Select
                label="Produit"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value as number | '')}
              >
                <MenuItem value="">Sélectionner…</MenuItem>
                {productsStore.products.map((p: { id: number | string; name: string; unitPrice?: number }) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name} – {Number(p.unitPrice ?? 0).toFixed(2)} € HT
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              size="small"
              variant="contained"
              startIcon={<ShoppingCart />}
              onClick={handleAddProductAsLine}
              disabled={selectedProductId === ''}
              sx={financePrimaryButtonSx}
            >
              Ajouter cette ligne
            </Button>
          </Box>
        </Box>

        <Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
            <FinanceFormSectionTitle sx={{ mb: 0 }}>Lignes</FinanceFormSectionTitle>
            <Button size="small" startIcon={<Add />} onClick={handleAddLine} sx={financeOutlinedButtonSx}>
              Ligne vide
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
                  <TableCell align="right">Prix unit. HT</TableCell>
                  <TableCell align="right">TVA (0–1)</TableCell>
                  <TableCell width={48} />
                </TableRow>
              </TableHead>
              <TableBody>
                {form.lines.map((line, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        value={line.description}
                        onChange={(e) => handleLineChange(i, 'description', e.target.value)}
                        sx={financeFieldSx}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        sx={{ width: 70, ...financeFieldSx }}
                        value={line.quantity}
                        onChange={(e) => handleLineChange(i, 'quantity', e.target.value)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        sx={{ width: 100, ...financeFieldSx }}
                        value={line.unitPrice}
                        onChange={(e) => handleLineChange(i, 'unitPrice', e.target.value)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        inputProps={{ min: 0, max: 1, step: 0.01 }}
                        sx={{ width: 80, ...financeFieldSx }}
                        value={line.taxRate ?? 0.2}
                        onChange={(e) => handleLineChange(i, 'taxRate', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="error"
                        disabled={form.lines.length <= 1}
                        onClick={() => handleRemoveLine(i)}
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
