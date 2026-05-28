import { useState, useEffect } from 'react'
import {
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  FormControlLabel,
  Checkbox,
  Alert,
  Stack,

  InputAdornment,
  alpha,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from '@mui/material'
import {
  ReceiptLong,
  Email,
  CalendarMonth,
  Payments,
} from '@mui/icons-material'
import { financePrimaryButtonSx, financeOutlinedButtonSx } from '../../../components/finance/financeStyles'
import {
  FinanceFormDialogShell,
  FinanceFormSectionTitle,
  FinanceFormTotalsBox,
  financeFieldSx,
} from '../../../components/finance/FinanceFormDialog'
import { EditableProductLinesTable } from '../../../components/finance/EditableProductLinesTable'
import { apiClient } from '../../../services/api'
import { clientService, parseClientsListResponse } from '../../../services/clients'
import type { Client } from '../../../services/clients'
import { useProductsStore } from '../../../stores/productsStore'
import { productService } from '../../../services/productService'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  total: number
  totalWithTax: number
}

interface CreateInvoiceData {
  clientId?: string
  newClientName?: string
  issueDate: string
  dueDate: string
  items: Omit<InvoiceItem, 'id' | 'total' | 'totalWithTax'>[]
  notes?: string
  terms?: string
  currency?: string
  paidExternally?: boolean
  externalPaymentDate?: string
  externalPaymentMethod?: string
  clientEmail?: string
  sendByEmailAfterCreate?: boolean
  sendToEmail?: string
  applyClientCredits?: boolean
}

interface CreateInvoiceDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateInvoiceData) => void | Promise<void>
  submitting?: boolean
  defaultClientId?: string
}

function createEmptyInvoiceForm(): CreateInvoiceData {
  return {
    clientId: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 20 }],
    notes: '',
    terms: 'Paiement à 30 jours',
    currency: 'EUR',
    applyClientCredits: true,
  }
}

export function CreateInvoiceDialog({
  open,
  onClose,
  onSubmit,
  submitting = false,
  defaultClientId,
}: CreateInvoiceDialogProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const productsStore = useProductsStore()
  
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CreateInvoiceData>(createEmptyInvoiceForm)
  const [willCreateClient, setWillCreateClient] = useState(false)

  const emailNorm = (formData.clientEmail ?? '').trim().toLowerCase()
  const matchedClient = emailNorm
    ? clients.find((c) => c.email?.trim().toLowerCase() === emailNorm)
    : undefined

  useEffect(() => {
    if (open) {
      setFormData({
        ...createEmptyInvoiceForm(),
        ...(defaultClientId ? { clientId: defaultClientId } : {}),
      })
      loadClients()
      if (productsStore.isStale || productsStore.products.length === 0) {
        productsStore.fetchProducts()
      }
    }
  }, [open, defaultClientId])

  useEffect(() => {
    if (!emailNorm) {
      setWillCreateClient(false)
      return
    }
    if (matchedClient) {
      setWillCreateClient(false)
      setFormData((prev) =>
        prev.clientId === matchedClient.id
          ? prev
          : { ...prev, clientId: matchedClient.id, newClientName: undefined },
      )
      return
    }
    setWillCreateClient(true)
    setFormData((prev) => ({
      ...prev,
      clientId: '',
      newClientName:
        prev.newClientName ||
        emailNorm
          .split('@')[0]
          ?.replace(/[._+-]+/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase()) ||
        'Client',
    }))
  }, [emailNorm, clients])

  const loadClients = async () => {
    try {
      setLoading(true)
      apiClient.invalidateCache('/clients')
      const response = await clientService.getClients({ page: 1, limit: 100 })
      const list = parseClientsListResponse(response)
      if (defaultClientId && !list.some((c) => c.id === defaultClientId)) {
        try {
          const one = await clientService.getClient(defaultClientId)
          if (one.data) list.push(one.data)
        } catch {
          // client hors première page
        }
      }
      setClients(list)
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error)
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open || !defaultClientId) return
    const c = clients.find((cl) => cl.id === defaultClientId)
    if (!c) return
    setWillCreateClient(false)
    setFormData((prev) => ({
      ...prev,
      clientId: c.id,
      clientEmail: c.email?.trim() || prev.clientEmail,
      newClientName: undefined,
    }))
  }, [open, defaultClientId, clients])

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: '',
          quantity: 1,
          unitPrice: 0,
          taxRate: 20
        }
      ]
    }))
  }

  const handleRemoveItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }))
    }
  }

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    setFormData(prev => {
      const newItems = [...prev.items]
      if (field === 'quantity') {
        newItems[index] = { ...newItems[index], quantity: 1 }
      } else if (field === 'unitPrice') {
        newItems[index] = { ...newItems[index], unitPrice: Math.round(Number(value) || 0) }
      } else {
        newItems[index] = { ...newItems[index], [field]: value }
      }
      
      // Recalculer les totaux
      if (field === 'quantity' || field === 'unitPrice' || field === 'taxRate') {
        // Note: total et totalWithTax ne sont pas stockés dans formData.items
        // mais calculés dynamiquement dans calculateTotals()
      }
      
      return { ...prev, items: newItems }
    })
  }

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (1 * item.unitPrice), 0)
    const taxTotal = formData.items.reduce((sum, item) => {
      const itemTotal = 1 * item.unitPrice
      return sum + (itemTotal * item.taxRate / 100)
    }, 0)
    const total = subtotal + taxTotal
    
    return { subtotal, taxTotal, total }
  }

  const handleSubmit = async () => {
    const selected = formData.clientId
      ? clients.find((c) => c.id === formData.clientId)
      : undefined
    const email =
      formData.clientEmail?.trim() ||
      matchedClient?.email ||
      selected?.email?.trim()
    if (!email || formData.items.some((item) => !item.description || item.unitPrice < 0)) {
      return
    }
    if (willCreateClient && !formData.newClientName?.trim()) {
      return
    }
    if (formData.sendByEmailAfterCreate && !(formData.sendToEmail || email)?.trim()) {
      return
    }

    const existingNames = new Set(
      productsStore.products.map((p) => (p.description ?? p.name ?? '').trim().toLowerCase()),
    )
    const productCandidates = formData.items
      .map((line) => ({
        name: String(line.description ?? '').trim(),
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
        // On laisse la création de la facture continuer même si la création produit échoue.
      }
    }

    const payload: CreateInvoiceData = {
      ...formData,
      clientEmail: email,
      clientId: matchedClient?.id || formData.clientId || undefined,
      sendToEmail: formData.sendToEmail?.trim() || email,
      items: formData.items.map((it) => ({
        ...it,
        quantity: 1,
        unitPrice: Math.round(Number(it.unitPrice) || 0),
      })),
    }
    await onSubmit(payload)
  }

  const { subtotal, taxTotal, total } = calculateTotals()

  const currencySymbol = formData.currency === 'USD' ? '$' : formData.currency === 'GBP' ? '£' : '€'

  return (
    <FinanceFormDialogShell
      open={open}
      onClose={onClose}
      closeDisabled={submitting}
      fullScreen={isMobile}
      title="Nouvelle facture"
      subtitle="Client, lignes, échéances et options d’envoi ou de règlement externe."
      icon={<ReceiptLong />}
      actions={
        <>
          <Button onClick={onClose} disabled={submitting} sx={financeOutlinedButtonSx}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={
              submitting ||
              !(formData.clientEmail?.trim() || formData.clientId) ||
              (willCreateClient && !formData.newClientName?.trim()) ||
              formData.items.some((item) => !item.description || item.unitPrice <= 0) ||
              (formData.sendByEmailAfterCreate &&
                !(formData.sendToEmail || formData.clientEmail)?.trim())
            }
            sx={financePrimaryButtonSx}
            startIcon={
              submitting ? <CircularProgress size={18} color="inherit" /> : undefined
            }
          >
            {submitting ? 'Création…' : 'Créer la facture'}
          </Button>
        </>
      }
    >
        <Stack spacing={2.5}>
          <Box>
            <FinanceFormSectionTitle>Client &amp; devise</FinanceFormSectionTitle>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField
              fullWidth
              required
              type="email"
              label="Email du client"
              value={formData.clientEmail ?? ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  clientEmail: e.target.value,
                  sendToEmail: prev.sendByEmailAfterCreate ? e.target.value : prev.sendToEmail,
                }))
              }
              placeholder="client@exemple.com"
              sx={financeFieldSx}
              helperText={
                willCreateClient
                  ? 'Nouvelle fiche client sera créée automatiquement'
                  : matchedClient
                    ? `Client existant : ${matchedClient.name}`
                    : 'Saisissez l’email du payeur'
              }
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                },
              }}
            />

            {willCreateClient && (
              <TextField
                fullWidth
                required
                label="Nom du nouveau client"
                value={formData.newClientName ?? ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, newClientName: e.target.value }))
                }
                sx={financeFieldSx}
              />
            )}

            <FormControl fullWidth sx={{ gridColumn: { sm: '1 / -1' }, ...financeFieldSx }}>
              <InputLabel>Client existant (optionnel)</InputLabel>
              <Select
                value={formData.clientId ?? ''}
                label="Client existant (optionnel)"
                onChange={(e) => {
                  const id = e.target.value
                  const c = clients.find((cl) => cl.id === id)
                  setFormData((prev) => ({
                    ...prev,
                    clientId: id,
                    clientEmail: c?.email || prev.clientEmail,
                    newClientName: undefined,
                  }))
                }}
                disabled={loading}
              >
                <MenuItem value="">
                  <em>Aucun — utiliser l’email ci-dessus</em>
                </MenuItem>
                {clients.map((client) => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.name}
                    {client.email ? ` — ${client.email}` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Devise"
              value={formData.currency}
              onChange={(e) => setFormData((prev) => ({ ...prev, currency: e.target.value }))}
              select
              sx={financeFieldSx}
            >
              <MenuItem value="EUR">EUR (€)</MenuItem>
              <MenuItem value="USD">USD ($)</MenuItem>
              <MenuItem value="GBP">GBP (£)</MenuItem>
            </TextField>
            </Box>
          </Box>

          <Box>
            <FinanceFormSectionTitle>Échéances</FinanceFormSectionTitle>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
            gap: 2 
          }}>
            <TextField
              fullWidth
              label="Date d'émission"
              type="date"
              value={formData.issueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
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
            
            <TextField
              fullWidth
              label="Date d'échéance"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
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
          </Box>

          <Box>
            <EditableProductLinesTable
              title="Lignes de facturation"
              addLabel="Ajouter une ligne"
              lines={formData.items.map((it) => ({
                description: it.description,
                quantity: 1,
                unitPrice: Math.round(Number(it.unitPrice) || 0),
                taxRate: it.taxRate,
              }))}
              products={productsStore.products}
              taxHeader="TVA (%)"
              taxInputProps={{ min: 0, max: 100, step: 0.1 }}
              unitPriceWidth={100}
              taxWidth={80}
              onAddLine={handleAddItem}
              onRemoveLine={handleRemoveItem}
              onLineChange={(index, field, value) => {
                if (field === 'quantity' || field === 'unitPrice' || field === 'taxRate') {
                  handleItemChange(index, field, Number(value) || 0)
                  return
                }
                handleItemChange(index, field, value)
              }}
            />
          </Box>

          <FinanceFormTotalsBox
            rows={[
              { label: 'Sous-total HT', value: `${Math.round(subtotal).toFixed(0)} ${currencySymbol}` },
              { label: 'TVA', value: `${Math.round(taxTotal).toFixed(0)} ${currencySymbol}` },
            ]}
            totalLabel="Total TTC"
            totalValue={`${Math.round(total).toFixed(0)} ${currencySymbol}`}
          />

          <Box>
            <FinanceFormSectionTitle>Options</FinanceFormSectionTitle>
          <Alert severity="info" sx={{ borderRadius: 2, mb: 2 }}>
            Cochez « Déjà réglée » si le client a payé sur un autre site (boutique, plateforme, virement).
            Vous pourrez ensuite envoyer la facture par email comme justificatif.
          </Alert>

          <FormControlLabel
            control={
              <Checkbox
                checked={!!formData.paidExternally}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    paidExternally: e.target.checked,
                    externalPaymentDate: e.target.checked
                      ? prev.issueDate
                      : undefined,
                    externalPaymentMethod: e.target.checked
                      ? prev.externalPaymentMethod || 'Autre site'
                      : undefined,
                  }))
                }
              />
            }
            label="Facture déjà réglée (autre site / virement)"
          />

          {formData.paidExternally && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
              }}
            >
              <TextField
                fullWidth
                label="Date du règlement"
                type="date"
                value={formData.externalPaymentDate ?? formData.issueDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    externalPaymentDate: e.target.value,
                  }))
                }
                InputLabelProps={{ shrink: true }}
                sx={financeFieldSx}
              />
              <TextField
                fullWidth
                label="Mode de règlement"
                value={formData.externalPaymentMethod ?? 'Autre site'}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    externalPaymentMethod: e.target.value,
                  }))
                }
                placeholder="Ex. Stripe boutique, PayPal, virement"
                sx={financeFieldSx}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Payments fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>
          )}

          <FormControlLabel
            control={
              <Checkbox
                checked={!!formData.sendByEmailAfterCreate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    sendByEmailAfterCreate: e.target.checked,
                    sendToEmail: e.target.checked
                      ? prev.sendToEmail || prev.clientEmail || ''
                      : undefined,
                  }))
                }
              />
            }
            label="Envoyer par email au client après création"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={formData.applyClientCredits !== false}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    applyClientCredits: e.target.checked,
                  }))
                }
              />
            }
            label="Imputer automatiquement les avoirs client disponibles"
          />

          {formData.sendByEmailAfterCreate && (
            <TextField
              fullWidth
              required
              type="email"
              label="Email d’envoi"
              value={formData.sendToEmail ?? formData.clientEmail ?? ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, sendToEmail: e.target.value }))
              }
              sx={financeFieldSx}
            />
          )}
          </Box>

          <Box>
            <FinanceFormSectionTitle>Compléments</FinanceFormSectionTitle>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
            gap: 2 
          }}>
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Notes additionnelles pour la facture..."
              sx={financeFieldSx}
            />
            
            <TextField
              fullWidth
              label="Conditions de paiement"
              multiline
              rows={3}
              value={formData.terms}
              onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
              placeholder="Conditions de paiement..."
              sx={financeFieldSx}
            />
          </Box>
          </Box>
        </Stack>
    </FinanceFormDialogShell>
  )
}
