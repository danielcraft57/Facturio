import { useState, useEffect, useRef } from 'react'
import {
  Button,
  TextField,
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
import {
  applyProductLineFieldChange,
  ensureTrailingEmptyLine,
  filterProductLinesForSubmit,
  removeProductLine,
} from '../../../components/finance/editableProductLinesUtils'
import { FinanceClientAutocomplete, type FinanceClientOption } from '../../../components/finance/FinanceClientAutocomplete'
import { clientQueryDraft, guessClientNameFromQuery, isClientEmail } from '../../../components/finance/financeClientQuery'
import { apiClient } from '../../../services/api'
import { clientService, parseClientsListResponse } from '../../../services/clients'
import type { Client } from '../../../services/clients'
import { useProductsStore } from '../../../stores/productsStore'
import { productService } from '../../../services/productService'
import { suggestProductSkuFromName } from '../../products/utils/productSku'
import { useToast } from '../../../components/useToast'

interface InvoiceItem {
  id: string
  productId?: number
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
  const toast = useToast()
  const submitInFlightRef = useRef(false)
  const [submitInFlight, setSubmitInFlight] = useState(false)

  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CreateInvoiceData>(createEmptyInvoiceForm)
  const [willCreateClient, setWillCreateClient] = useState(false)
  const [clientQuery, setClientQuery] = useState('')
  const [createClientError, setCreateClientError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    submitInFlightRef.current = false
    setSubmitInFlight(false)
  }, [open])

  useEffect(() => {
    if (open) {
      setFormData({
        ...createEmptyInvoiceForm(),
        ...(defaultClientId ? { clientId: defaultClientId } : {}),
      })
      setClientQuery('')
      setCreateClientError(null)
      loadClients()
      productsStore.fetchProducts()
    }
  }, [open, defaultClientId])

  const clientOptions: FinanceClientOption[] = clients.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
  }))

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
    setClientQuery(c.email ? `${c.name} — ${c.email}` : c.name)
  }, [open, defaultClientId, clients])

  const createEmptyInvoiceItem = (): CreateInvoiceData['items'][number] => ({
    description: '',
    quantity: 1,
    unitPrice: 0,
    taxRate: 20,
  })

  const handleRemoveItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: removeProductLine(prev.items, index, createEmptyInvoiceItem),
    }))
  }

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      items: applyProductLineFieldChange(
        prev.items,
        index,
        (item) => {
          if (field === 'quantity') {
            item.quantity = 1
          } else if (field === 'unitPrice') {
            item.unitPrice = Math.round(Number(value) || 0)
          } else if (field === 'description') {
            item.description = String(value)
            item.productId = undefined
          } else {
            return { ...item, [field]: value }
          }
          return item
        },
        createEmptyInvoiceItem,
      ),
    }))
  }

  const calculateTotals = () => {
    const activeItems = filterProductLinesForSubmit(formData.items)
    const subtotal = activeItems.reduce((sum, item) => sum + 1 * item.unitPrice, 0)
    const taxTotal = activeItems.reduce((sum, item) => {
      const itemTotal = 1 * item.unitPrice
      return sum + (itemTotal * item.taxRate / 100)
    }, 0)
    const total = subtotal + taxTotal
    
    return { subtotal, taxTotal, total }
  }

  const ensureProductsLinked = async (itemsToLink: typeof formData.items) => {
    const existingByName = new Map(
      productsStore.products.map((p) => [((p.description ?? p.name ?? '').trim().toLowerCase()), p]),
    )
    const nextItems = [...itemsToLink]
    for (let i = 0; i < nextItems.length; i += 1) {
      const item = nextItems[i]
      const key = String(item.description ?? '').trim().toLowerCase()
      if (!key) continue
      const known = existingByName.get(key)
      if (known) {
        nextItems[i] = {
          ...item,
          productId: Number(known.id),
          unitPrice: Math.round(Number(known.unitPrice ?? item.unitPrice ?? 0)),
        }
        continue
      }
      try {
        const lineName = String(item.description ?? '').trim()
        const created = await productService.createProduct({
          name: lineName,
          sku: suggestProductSkuFromName(lineName),
          description: lineName,
          unitPrice: Number(item.unitPrice) > 0 ? Number(item.unitPrice) : undefined,
        })
        const createdProduct = created.data
        if (createdProduct) {
          existingByName.set(key, createdProduct)
          nextItems[i] = {
            ...item,
            productId: Number(createdProduct.id),
            unitPrice: Math.round(Number(createdProduct.unitPrice ?? item.unitPrice ?? 0)),
          }
        }
      } catch (err) {
        console.error('Création automatique du produit catalogue', err)
        toast.warning(
          `Impossible d'enregistrer « ${String(item.description ?? '').trim()} » dans le catalogue — la facture sera créée sans lien produit.`,
        )
      }
    }
    await productsStore.fetchProducts()
    return nextItems
  }

  const handleSubmit = async () => {
    if (submitInFlightRef.current || submitting) return
    submitInFlightRef.current = true
    setSubmitInFlight(true)
    try {
      const email = formData.clientEmail?.trim()
      const filledItems = filterProductLinesForSubmit(formData.items)
      if (
        !email ||
        filledItems.length === 0 ||
        filledItems.some((item) => item.unitPrice < 0)
      ) {
        return
      }
      if (willCreateClient && !formData.newClientName?.trim()) {
        return
      }
      const items = await ensureProductsLinked(filledItems)

      const payload: CreateInvoiceData = {
        ...formData,
        clientEmail: email,
        clientId: formData.clientId || undefined,
        items: items.map((it) => ({
          ...it,
          quantity: 1,
          unitPrice: Math.round(Number(it.unitPrice) || 0),
        })),
        currency: 'EUR',
      }
      await onSubmit(payload)
    } finally {
      submitInFlightRef.current = false
      setSubmitInFlight(false)
    }
  }

  const { subtotal, taxTotal, total } = calculateTotals()

  const currencySymbol = '€'
  const submitBusy = submitting || submitInFlight

  return (
    <FinanceFormDialogShell
      open={open}
      onClose={onClose}
      closeDisabled={submitBusy}
      fullScreen={isMobile}
      title="Nouvelle facture"
      subtitle="Client, lignes, échéances et options de règlement."
      icon={<ReceiptLong />}
      actions={
        <>
          <Button onClick={onClose} disabled={submitBusy} sx={financeOutlinedButtonSx}>
            Annuler
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            variant="contained"
            disabled={
              submitBusy ||
              !(formData.clientEmail?.trim() || formData.clientId) ||
              (willCreateClient && !formData.newClientName?.trim()) ||
              filterProductLinesForSubmit(formData.items).length === 0 ||
              filterProductLinesForSubmit(formData.items).some((item) => item.unitPrice <= 0)
            }
            sx={financePrimaryButtonSx}
            startIcon={
              submitBusy ? <CircularProgress size={18} color="inherit" /> : undefined
            }
          >
            {submitBusy ? 'Création…' : 'Créer la facture'}
          </Button>
        </>
      }
    >
        <Stack spacing={2.5}>
          <Box>
            <FinanceFormSectionTitle>Client</FinanceFormSectionTitle>
            <Box sx={financeFieldSx}>
              <FinanceClientAutocomplete
                label="Client"
                placeholder="Nom ou email…"
                options={clientOptions}
                loading={loading}
                valueId={formData.clientId ?? ''}
                query={clientQuery}
                onQueryChange={(v) => {
                  setClientQuery(v)
                  setCreateClientError(null)
                  const draft = clientQueryDraft(
                    v,
                    clients.map((c) => ({ id: c.id, name: c.name, email: c.email })),
                  )
                  if (!v.trim()) {
                    setWillCreateClient(false)
                    setFormData((p) => ({ ...p, clientId: '', clientEmail: '', newClientName: undefined }))
                    return
                  }
                  if (draft.matched) {
                    setWillCreateClient(false)
                    setFormData((p) => ({
                      ...p,
                      clientId: draft.matched!.id,
                      clientEmail: draft.matched!.email?.trim() ?? p.clientEmail,
                      newClientName: undefined,
                    }))
                    return
                  }
                  setWillCreateClient(true)
                  setFormData((p) => ({
                    ...p,
                    clientId: '',
                    clientEmail: draft.suggestedEmail || p.clientEmail,
                    newClientName: draft.suggestedName,
                  }))
                }}
                onCreateRequested={() => {
                  const seed = clientQuery.trim()
                  setWillCreateClient(true)
                  setCreateClientError(null)
                  setFormData((p) => ({
                    ...p,
                    clientId: '',
                    clientEmail: isClientEmail(seed) ? seed.toLowerCase() : p.clientEmail,
                    newClientName: p.newClientName?.trim() ? p.newClientName : guessClientNameFromQuery(seed),
                  }))
                }}
                onSelectClientId={(id) => {
                  const c = clients.find((cl) => cl.id === id)
                  if (!c) return
                  setWillCreateClient(false)
                  setFormData((p) => ({
                    ...p,
                    clientId: c.id,
                    clientEmail: c.email?.trim() || p.clientEmail,
                    newClientName: undefined,
                  }))
                  setClientQuery(c.email ? `${c.name} — ${c.email}` : c.name)
                }}
                helperText="Tapez pour rechercher. Si le client n’existe pas, créez-le ici."
                creatingInline={willCreateClient}
                createName={formData.newClientName ?? ''}
                createEmail={formData.clientEmail ?? ''}
                createError={createClientError}
                onCreateNameChange={(v) => setFormData((p) => ({ ...p, newClientName: v }))}
                onCreateEmailChange={(v) => setFormData((p) => ({ ...p, clientEmail: v }))}
                onCreateCancel={() => {
                  setWillCreateClient(false)
                  setCreateClientError(null)
                }}
              />
            </Box>
          </Box>

          <EditableProductLinesTable
              title="Lignes de facturation"
              lines={formData.items.map((it) => ({
                description: it.description,
                quantity: 1,
                unitPrice: Math.round(Number(it.unitPrice) || 0),
                taxRate: it.taxRate,
              }))}
              products={productsStore.products}
              taxHeader="TVA (%)"
              taxInputProps={{ min: 0, max: 100, step: 0.1 }}
              unitPriceWidth={96}
              taxWidth={80}
              descriptionWidth="64%"
              onRemoveLine={handleRemoveItem}
              onLineChange={(index, field, value) => {
                if (field === 'quantity' || field === 'unitPrice' || field === 'taxRate') {
                  handleItemChange(index, field, Number(value) || 0)
                  return
                }
                handleItemChange(index, field, value)
              }}
              onProductPicked={(index, product) => {
                setFormData((prev) => {
                  const next = [...prev.items]
                  next[index] = {
                    ...next[index],
                    description: (product.description ?? product.name ?? '').trim(),
                    productId: Number(product.id),
                    unitPrice: Math.round(Number(product.unitPrice ?? next[index].unitPrice ?? 0)),
                  }
                  return {
                    ...prev,
                    items: ensureTrailingEmptyLine(next, createEmptyInvoiceItem),
                  }
                })
              }}
            />

          <Box>
            <FinanceFormSectionTitle>Échéances</FinanceFormSectionTitle>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: 2,
              }}
            >
              <TextField
                fullWidth
                label="Date d'échéance"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                sx={financeFieldSx}
              />
            </Box>
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
