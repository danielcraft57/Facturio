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
  FormControlLabel,
  Checkbox,
  Alert,
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
  useTheme,
  useMediaQuery,
  CircularProgress,
} from '@mui/material'
import {
  Add,
  Delete,
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
import { apiClient } from '../../../services/api'
import { clientService, parseClientsListResponse } from '../../../services/clients'
import type { Client } from '../../../services/clients'

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
      setClients(parseClientsListResponse(response))
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error)
      setClients([])
    } finally {
      setLoading(false)
    }
  }

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
      newItems[index] = { ...newItems[index], [field]: value }
      
      // Recalculer les totaux
      if (field === 'quantity' || field === 'unitPrice' || field === 'taxRate') {
        // Note: total et totalWithTax ne sont pas stockés dans formData.items
        // mais calculés dynamiquement dans calculateTotals()
      }
      
      return { ...prev, items: newItems }
    })
  }

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    const taxTotal = formData.items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unitPrice
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
    if (!email || formData.items.some((item) => !item.description || item.unitPrice <= 0)) {
      return
    }
    if (willCreateClient && !formData.newClientName?.trim()) {
      return
    }
    if (formData.sendByEmailAfterCreate && !(formData.sendToEmail || email)?.trim()) {
      return
    }
    const payload: CreateInvoiceData = {
      ...formData,
      clientEmail: email,
      clientId: matchedClient?.id || formData.clientId || undefined,
      sendToEmail: formData.sendToEmail?.trim() || email,
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
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
              <FinanceFormSectionTitle>Lignes de facturation</FinanceFormSectionTitle>
              <Button
                startIcon={<Add />}
                onClick={handleAddItem}
                variant="outlined"
                size="small"
                sx={financeOutlinedButtonSx}
              >
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
                    <TableCell sx={{ width: '40%' }}>Description</TableCell>
                    <TableCell align="right" sx={{ width: '15%' }}>Quantité</TableCell>
                    <TableCell align="right" sx={{ width: '20%' }}>Prix unitaire</TableCell>
                    <TableCell align="right" sx={{ width: '15%' }}>TVA (%)</TableCell>
                    <TableCell align="right" sx={{ width: '10%' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Description de l'article"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                          inputProps={{ min: 1, style: { textAlign: 'right' } }}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          inputProps={{ min: 0, step: 0.01, style: { textAlign: 'right' } }}
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="number"
                          value={item.taxRate}
                          onChange={(e) => handleItemChange(index, 'taxRate', parseFloat(e.target.value) || 0)}
                          inputProps={{ min: 0, max: 100, step: 0.1, style: { textAlign: 'right' } }}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveItem(index)}
                          disabled={formData.items.length === 1}
                          color="error"
                        >
                          <Delete />
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
              { label: 'Sous-total HT', value: `${subtotal.toFixed(2)} ${currencySymbol}` },
              { label: 'TVA', value: `${taxTotal.toFixed(2)} ${currencySymbol}` },
            ]}
            totalLabel="Total TTC"
            totalValue={`${total.toFixed(2)} ${currencySymbol}`}
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
