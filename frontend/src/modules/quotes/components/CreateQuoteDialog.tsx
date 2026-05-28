import { useState, useEffect } from 'react'
import {
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Stack,
  InputAdornment,
  CircularProgress,
} from '@mui/material'
import { Description, CalendarMonth } from '@mui/icons-material'
import { apiClient } from '../../../services/api'
import { clientService, parseClientsListResponse } from '../../../services/clients'
import { useProductsStore } from '../../../stores/productsStore'
import { productService } from '../../../services/productService'
import type { CreateQuoteLineData } from '../../../types/quote'
import { financePrimaryButtonSx, financeOutlinedButtonSx } from '../../../components/finance/financeStyles'
import {
  FinanceFormDialogShell,
  FinanceFormSectionTitle,
  FinanceFormTotalsBox,
  financeFieldSx,
} from '../../../components/finance/FinanceFormDialog'
import { EditableProductLinesTable } from '../../../components/finance/EditableProductLinesTable'

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
      if (field === 'quantity') {
        line.quantity = 1
      } else if (field === 'unitPrice') {
        line.unitPrice = Math.round(Number(value) || 0)
      } else if (field === 'taxRate') {
        line.taxRate = Number(value)
      } else if (field === 'description') {
        line.description = String(value)
      } else if (field === 'productId') {
        line.productId = Number(value)
      }
      next[index] = line
      return { ...prev, lines: next }
    })
  }

  const handleSubmit = async () => {
    if (
      formData.clientId === '' ||
      formData.lines.some((l) => !l.description.trim() || Number(l.unitPrice) < 0)
    ) {
      return
    }
    const existingNames = new Set(
      productsStore.products.map((p) => (p.description ?? p.name ?? '').trim().toLowerCase()),
    )
    const productCandidates = formData.lines
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
        // On laisse la création du devis continuer même si la création produit échoue.
      }
    }
    onSubmit({
      clientId: formData.clientId,
      expiryDate: formData.expiryDate || undefined,
      lines: formData.lines.map(({ productId, description, quantity, unitPrice, taxRate }) => ({
        productId: productId ?? undefined,
        description: description.trim(),
        quantity: 1,
        unitPrice: Math.round(Number(unitPrice)),
        taxRate: Number(taxRate),
      })),
    })
    onClose()
  }

  const subtotal = formData.lines.reduce(
    (s, l) => s + 1 * Number(l.unitPrice),
    0,
  )
  const tax = formData.lines.reduce(
    (s, l) => s + 1 * Number(l.unitPrice) * Number(l.taxRate ?? 0),
    0,
  )
  const total = subtotal + tax

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

        <EditableProductLinesTable
          title="Lignes du devis"
          addLabel="Ligne vide"
          lines={formData.lines.map((line) => ({
            description: line.description,
            quantity: 1,
            unitPrice: Math.round(Number(line.unitPrice ?? 0)),
            taxRate: Number(line.taxRate ?? 0.2),
          }))}
          products={productsStore.products}
          taxHeader="TVA (0-1)"
          taxInputProps={{ min: 0, max: 1, step: 0.01 }}
          unitPriceWidth={100}
          taxWidth={80}
          onAddLine={handleAddLine}
          onRemoveLine={handleRemoveLine}
          onLineChange={(index, field, value) => handleLineChange(index, field, value)}
        />

        <FinanceFormTotalsBox
          rows={[
            { label: 'Total HT', value: `${Math.round(subtotal).toFixed(0)} €` },
            { label: 'TVA', value: `${Math.round(tax).toFixed(0)} €` },
          ]}
          totalLabel="Total TTC"
          totalValue={`${Math.round(total).toFixed(0)} €`}
        />
      </Stack>
    </FinanceFormDialogShell>
  )
}
