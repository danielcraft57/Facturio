import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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

  Divider,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from '@mui/material'
import {
  Add,
  Delete,
  Close,
  Save,
  Cancel
} from '@mui/icons-material'
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
  clientId: string
  issueDate: string
  dueDate: string
  items: Omit<InvoiceItem, 'id' | 'total' | 'totalWithTax'>[]
  notes?: string
  terms?: string
  currency?: string
}

interface CreateInvoiceDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateInvoiceData) => void | Promise<void>
  submitting?: boolean
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

export function CreateInvoiceDialog({ open, onClose, onSubmit, submitting = false }: CreateInvoiceDialogProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CreateInvoiceData>(createEmptyInvoiceForm)

  useEffect(() => {
    if (open) {
      setFormData(createEmptyInvoiceForm())
      loadClients()
    }
  }, [open])

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
    if (!formData.clientId || formData.items.some(item => !item.description || item.unitPrice <= 0)) {
      return
    }
    await onSubmit(formData)
  }

  const { subtotal, taxTotal, total } = calculateTotals()

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Créer une nouvelle facture</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Informations de base */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
            gap: 2 
          }}>
            <FormControl fullWidth>
              <InputLabel>Client</InputLabel>
              <Select
                value={formData.clientId}
                label="Client"
                onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                disabled={loading}
              >
                {clients.length === 0 && !loading && (
                  <MenuItem disabled value="">
                    Aucun client — créez-en un dans Clients
                  </MenuItem>
                )}
                {clients.map((client) => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Devise"
              value={formData.currency}
              onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
              select
            >
              <MenuItem value="EUR">EUR (€)</MenuItem>
              <MenuItem value="USD">USD ($)</MenuItem>
              <MenuItem value="GBP">GBP (£)</MenuItem>
            </TextField>
          </Box>

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
            />
            
            <TextField
              fullWidth
              label="Date d'échéance"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          {/* Articles */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Articles</Typography>
              <Button
                startIcon={<Add />}
                onClick={handleAddItem}
                variant="outlined"
                size="small"
              >
                Ajouter un article
              </Button>
            </Box>
            
            <TableContainer component={Paper} variant="outlined">
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

          {/* Totaux */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'flex-end',
            gap: 1,
            p: 2,
            bgcolor: 'grey.50',
            borderRadius: 1
          }}>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <Typography>Sous-total :</Typography>
              <Typography variant="h6">{subtotal.toFixed(2)} €</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <Typography>TVA :</Typography>
              <Typography variant="h6">{taxTotal.toFixed(2)} €</Typography>
            </Box>
            <Divider sx={{ width: '100%', my: 1 }} />
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Total :</Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {total.toFixed(2)} €
              </Typography>
            </Box>
          </Box>

          {/* Notes et conditions */}
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
            />
            
            <TextField
              fullWidth
              label="Conditions de paiement"
              multiline
              rows={3}
              value={formData.terms}
              onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
              placeholder="Conditions de paiement..."
            />
          </Box>
        </Stack>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button onClick={onClose} variant="outlined" startIcon={<Cancel />}>
          Annuler
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <Save />}
          disabled={
            submitting ||
            !formData.clientId ||
            formData.items.some(item => !item.description || item.unitPrice <= 0)
          }
        >
          {submitting ? 'Création...' : 'Créer la facture'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
