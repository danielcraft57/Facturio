import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Stack,
  Alert,
  Checkbox,
  FormControlLabel
} from '@mui/material'
import {
  Delete,
  Close
} from '@mui/icons-material'
import type { Invoice, InvoiceItem } from '../../../services/invoices'
import { formatCurrency } from '../../../utils/formatters'

interface CreditNoteItem {
  itemId: string
  itemIndex: number
  description: string
  quantity: number
  maxQuantity: number
  unitPrice: number
  taxRate: number
  reason?: string
  selected: boolean
}

interface CreateCreditNoteDialogProps {
  open: boolean
  onClose: () => void
  invoice: Invoice
  onSubmit: (items: Array<{ itemId: string; quantity: number; reason?: string }>) => Promise<void>
}

export function CreateCreditNoteDialog({ open, onClose, invoice, onSubmit }: CreateCreditNoteDialogProps) {
  const [items, setItems] = useState<CreditNoteItem[]>(() => {
    return invoice.items.map((item, index) => ({
      itemId: item.id,
      itemIndex: index,
      description: item.description,
      quantity: 0,
      maxQuantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
      reason: '',
      selected: false
    }))
  })

  const handleQuantityChange = (index: number, quantity: number) => {
    const updatedItems = [...items]
    updatedItems[index].quantity = Math.max(0, Math.min(quantity, updatedItems[index].maxQuantity))
    setItems(updatedItems)
  }

  const handleReasonChange = (index: number, reason: string) => {
    const updatedItems = [...items]
    updatedItems[index].reason = reason
    setItems(updatedItems)
  }

  const handleToggleSelect = (index: number) => {
    const updatedItems = [...items]
    updatedItems[index].selected = !updatedItems[index].selected
    if (updatedItems[index].selected && updatedItems[index].quantity === 0) {
      updatedItems[index].quantity = updatedItems[index].maxQuantity
    }
    setItems(updatedItems)
  }

  const handleSubmit = async () => {
    const selectedItems = items
      .filter(item => item.selected && item.quantity > 0)
      .map(item => ({
        itemId: item.itemId,
        quantity: item.quantity,
        reason: item.reason || undefined
      }))

    if (selectedItems.length === 0) {
      alert('Veuillez sélectionner au moins un article avec une quantité')
      return
    }

    await onSubmit(selectedItems)
    onClose()
  }

  const totalAmount = items
    .filter(item => item.selected)
    .reduce((sum, item) => {
      const lineTotal = item.quantity * item.unitPrice * (1 + item.taxRate / 100)
      return sum + lineTotal
    }, 0)

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Créer un avoir pour {invoice.number}</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Alert severity="info">
            Sélectionnez les articles à rembourser et indiquez la quantité pour chaque article.
          </Alert>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">Sélection</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Quantité max</TableCell>
                  <TableCell align="right">Quantité</TableCell>
                  <TableCell align="right">Prix unitaire</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Raison</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={item.selected}
                        onChange={() => handleToggleSelect(index)}
                      />
                    </TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell align="right">{item.maxQuantity}</TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(index, Number(e.target.value))}
                        disabled={!item.selected}
                        inputProps={{ min: 0, max: item.maxQuantity }}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                    <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell align="right">
                      {formatCurrency(item.quantity * item.unitPrice * (1 + item.taxRate / 100))}
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        placeholder="Raison (optionnel)"
                        value={item.reason}
                        onChange={(e) => handleReasonChange(index, e.target.value)}
                        disabled={!item.selected}
                        fullWidth
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {totalAmount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Box>
                <Typography variant="h6">
                  Montant total de l'avoir: {formatCurrency(totalAmount)}
                </Typography>
              </Box>
            </Box>
          )}
        </Stack>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Créer l'avoir
        </Button>
      </DialogActions>
    </Dialog>
  )
}

