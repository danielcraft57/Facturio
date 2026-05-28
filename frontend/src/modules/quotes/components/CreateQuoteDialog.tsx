import { useState, useEffect } from 'react'
import {
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  InputAdornment,
  alpha,
  CircularProgress,
} from '@mui/material'
import {
  Add,
  Delete,
  Description,
  CalendarMonth,
  ShoppingCart,
} from '@mui/icons-material'
import { apiClient } from '../../../services/api'
import { clientService, parseClientsListResponse } from '../../../services/clients'
import { useProductsStore } from '../../../stores/productsStore'
import type { CreateQuoteLineData } from '../../../types/quote'
import { financePrimaryButtonSx, financeOutlinedButtonSx } from '../../../components/finance/financeStyles'
import {
  FinanceFormDialogShell,
  FinanceFormSectionTitle,
  FinanceFormTotalsBox,
  financeFieldSx,
} from '../../../components/finance/FinanceFormDialog'

interface CreateQuoteFormData {
  clientId: string
  expiryDate: string
  lines: (CreateQuoteLineData & { taxRate: number })[]
}

interface CreateQuoteDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: { clientId: string; expiryDate?: string; lines: CreateQuoteLineData[] }) => void
  defaultClientId?: string
  submitting?: boolean
}

interface ClientOption {
  id: string
  name: string
}

export function CreateQuoteDialog({
  open,
  onClose,
  onSubmit,
  defaultClientId,
  submitting = false,
}: CreateQuoteDialogProps) {
  const productsStore = useProductsStore()
  const [clients, setClients] = useState<ClientOption[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('')
  const [formData, setFormData] = useState<CreateQuoteFormData>({
    clientId: '',
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    lines: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 0.2 }],
  })

  useEffect(() => {
    if (open) {
      setFormData({
        clientId: defaultClientId ?? '',
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        lines: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 0.2 }],
      })
      loadClients()
      if (productsStore.isStale || productsStore.products.length === 0) {
        productsStore.fetchProducts()
      }
    }
  }, [open, defaultClientId])

  const loadClients = async () => {
    try {
      setLoading(true)
      apiClient.invalidateCache('/clients')
      const res = await clientService.getClients({ page: 1, limit: 100 })
      const list = parseClientsListResponse(res)
      if (defaultClientId && !list.some((c) => c.id === defaultClientId)) {
        try {
          const one = await clientService.getClient(defaultClientId)
          if (one.data) list.push(one.data)
        } catch {
          // client hors première page
        }
      }
      setClients(
        list.map((c) => ({
          id: String(c.id),
          name: c.name,
        })),
      )
    } catch (error) {
      console.error('Erreur chargement clients:', error)
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddLine = () => {
    setFormData((prev) => ({
      ...prev,
      lines: [...prev.lines, { description: '', quantity: 1, unitPrice: 0, taxRate: 0.2 }],
    }))
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
    const newLine = {
      productId: Number((product as { id: number | string }).id),
      description: description ?? '',
      quantity: 1,
      unitPrice,
      taxRate: 0.2,
    }
    setFormData((prev) => {
      const isSingleEmptyLine =
        prev.lines.length === 1 &&
        !String(prev.lines[0].description ?? '').trim() &&
        Number(prev.lines[0].unitPrice ?? 0) === 0
      if (isSingleEmptyLine) {
        return { ...prev, lines: [newLine] }
      }
      return { ...prev, lines: [...prev.lines, newLine] }
    })
  }

  const handleRemoveLine = (index: number) => {
    if (formData.lines.length <= 1) return
    setFormData((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index),
    }))
  }

  const handleLineChange = (
    index: number,
    field: keyof CreateQuoteLineData | 'taxRate',
    value: string | number,
  ) => {
    setFormData((prev) => {
      const next = [...prev.lines]
      const line = { ...next[index] }
      if (field === 'quantity' || field === 'unitPrice' || field === 'taxRate') {
        line[field] = Number(value)
      } else if (field === 'description') {
        line.description = String(value)
      } else if (field === 'productId') {
        line.productId = Number(value)
      }
      next[index] = line
      return { ...prev, lines: next }
    })
  }

  const handleSubmit = () => {
    if (
      formData.clientId === '' ||
      formData.lines.some((l) => !l.description.trim() || Number(l.unitPrice) < 0)
    ) {
      return
    }
    onSubmit({
      clientId: formData.clientId,
      expiryDate: formData.expiryDate || undefined,
      lines: formData.lines.map(({ productId, description, quantity, unitPrice, taxRate }) => ({
        productId: productId ?? undefined,
        description: description.trim(),
        quantity: Number(quantity),
        unitPrice: Number(unitPrice),
        taxRate: Number(taxRate),
      })),
    })
    onClose()
  }

  const subtotal = formData.lines.reduce(
    (s, l) => s + Number(l.quantity) * Number(l.unitPrice),
    0,
  )
  const tax = formData.lines.reduce(
    (s, l) => s + Number(l.quantity) * Number(l.unitPrice) * Number(l.taxRate ?? 0),
    0,
  )
  const total = subtotal + tax
  const totalHeures = formData.lines.reduce((s, l) => s + Number(l.quantity ?? 0), 0)

  const submitDisabled =
    submitting ||
    formData.clientId === '' ||
    formData.lines.some((l) => !l.description.trim())

  return (
    <FinanceFormDialogShell
      open={open}
      onClose={onClose}
      closeDisabled={submitting}
      title="Nouveau devis"
      subtitle="Client, validité, lignes HT et taux de TVA (décimal, ex. 0,2 = 20 %)."
      icon={<Description />}
      actions={
        <>
          <Button onClick={onClose} disabled={submitting} sx={financeOutlinedButtonSx}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitDisabled}
            sx={financePrimaryButtonSx}
            startIcon={
              submitting ? <CircularProgress size={18} color="inherit" /> : undefined
            }
          >
            {submitting ? 'Création…' : 'Créer le devis'}
          </Button>
        </>
      }
    >
      <Stack spacing={2.5}>
        <Box>
          <FinanceFormSectionTitle>Client</FinanceFormSectionTitle>
          <FormControl fullWidth sx={financeFieldSx} required>
            <InputLabel>Client</InputLabel>
            <Select
              value={formData.clientId}
              label="Client"
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, clientId: e.target.value as string }))
              }
              disabled={loading}
            >
              {clients.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box>
          <FinanceFormSectionTitle>Validité</FinanceFormSectionTitle>
          <TextField
            label="Date limite de validité"
            type="date"
            value={formData.expiryDate}
            onChange={(e) => setFormData((prev) => ({ ...prev, expiryDate: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            fullWidth
            sx={financeFieldSx}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarMonth fontSize="small" color="action" />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        <Box>
          <FinanceFormSectionTitle>Catalogue produits</FinanceFormSectionTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 280, flex: 1, ...financeFieldSx }}>
              <InputLabel>Ajouter un produit</InputLabel>
              <Select
                value={selectedProductId}
                label="Ajouter un produit"
                onChange={(e) => setSelectedProductId(e.target.value as number | '')}
              >
                <MenuItem value="">Sélectionner un produit…</MenuItem>
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
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Choisissez un produit puis cliquez sur « Ajouter cette ligne » — répétez pour plusieurs
            articles.
          </Typography>
        </Box>

        <Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
            <FinanceFormSectionTitle sx={{ mb: 0 }}>Lignes du devis</FinanceFormSectionTitle>
            <Button
              startIcon={<Add />}
              onClick={handleAddLine}
              size="small"
              variant="outlined"
              sx={financeOutlinedButtonSx}
            >
              Ligne vide
            </Button>
          </Stack>
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{
              borderRadius: 2,
              borderColor: (t) => alpha('#0f172a', t.palette.mode === 'dark' ? 0.2 : 0.1),
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Qté
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Prix unit. HT
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    TVA (0–1)
                  </TableCell>
                  <TableCell width={48} />
                </TableRow>
              </TableHead>
              <TableBody>
                {formData.lines.map((line, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        value={line.description}
                        onChange={(e) => handleLineChange(i, 'description', e.target.value)}
                        placeholder="Description"
                        sx={financeFieldSx}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        inputProps={{ min: 0.01, step: 1 }}
                        sx={{ width: 70, ...financeFieldSx }}
                        value={line.quantity}
                        onChange={(e) => handleLineChange(i, 'quantity', e.target.value)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        inputProps={{ min: 0, step: 0.01 }}
                        sx={{ width: 100, ...financeFieldSx }}
                        value={
                          line.unitPrice !== undefined && line.unitPrice !== null
                            ? line.unitPrice
                            : ''
                        }
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
                        placeholder="0.2"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveLine(i)}
                        disabled={formData.lines.length <= 1}
                        color="error"
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
            { label: 'Total heures / qté', value: String(totalHeures) },
            { label: 'Total HT', value: `${subtotal.toFixed(2)} €` },
            { label: 'TVA', value: `${tax.toFixed(2)} €` },
          ]}
          totalLabel="Total TTC"
          totalValue={`${total.toFixed(2)} €`}
        />
      </Stack>
    </FinanceFormDialogShell>
  )
}
