import { useState, useEffect } from 'react';
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
  Stack
} from '@mui/material';
import { Add, Delete, Close, ShoppingCart } from '@mui/icons-material';
import { apiClient } from '../../../services/api';
import { clientService, parseClientsListResponse } from '../../../services/clients';
import { useProductsStore } from '../../../stores/productsStore';
import type { CreateQuoteLineData } from '../../../types/quote';

interface CreateQuoteFormData {
  clientId: number | '';
  expiryDate: string;
  lines: (CreateQuoteLineData & { taxRate: number })[];
}

interface CreateQuoteDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { clientId: number; expiryDate?: string; lines: CreateQuoteLineData[] }) => void;
  defaultClientId?: number | string;
}

interface ClientOption {
  id: number;
  name: string;
}

export function CreateQuoteDialog({ open, onClose, onSubmit, defaultClientId }: CreateQuoteDialogProps) {
  const productsStore = useProductsStore();
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [formData, setFormData] = useState<CreateQuoteFormData>({
    clientId: '',
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    lines: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 0.2 }]
  });

  useEffect(() => {
    if (open) {
      const parsedClientId =
        defaultClientId !== undefined && defaultClientId !== ''
          ? Number(defaultClientId)
          : '';
      setFormData({
        clientId: Number.isFinite(parsedClientId) ? parsedClientId : '',
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        lines: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 0.2 }],
      });
      loadClients();
      if (productsStore.isStale || productsStore.products.length === 0) {
        productsStore.fetchProducts();
      }
    }
  }, [open, defaultClientId]);

  const loadClients = async () => {
    try {
      setLoading(true);
      apiClient.invalidateCache('/clients');
      const res = await clientService.getClients({ page: 1, limit: 100 });
      setClients(
        parseClientsListResponse(res).map((c) => ({
          id: Number(c.id),
          name: c.name,
        }))
      );
    } catch (error) {
      console.error('Erreur chargement clients:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLine = () => {
    setFormData(prev => ({
      ...prev,
      lines: [...prev.lines, { description: '', quantity: 1, unitPrice: 0, taxRate: 0.2 }]
    }));
  };

  const handleAddProductAsLine = () => {
    if (selectedProductId === '') return;
    const product = productsStore.products.find((p: any) => Number(p.id) === Number(selectedProductId));
    if (!product) return;
    const unitPrice = Number((product as any).unitPrice ?? (product as any).unit_price ?? 0);
    const description = (String((product as any).description ?? (product as any).name ?? '').trim() || (product as any).name) ?? '';
    const newLine = {
      productId: Number((product as any).id),
      description,
      quantity: 1,
      unitPrice,
      taxRate: 0.2
    };
    setFormData(prev => {
      const isSingleEmptyLine = prev.lines.length === 1
        && !String(prev.lines[0].description ?? '').trim()
        && Number(prev.lines[0].unitPrice ?? 0) === 0;
      if (isSingleEmptyLine) {
        return { ...prev, lines: [newLine] };
      }
      return { ...prev, lines: [...prev.lines, newLine] };
    });
    // On ne vide pas la sélection : tu peux recliquer sur Ajouter pour le même produit ou en choisir un autre
  };

  const handleRemoveLine = (index: number) => {
    if (formData.lines.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index)
    }));
  };

  const handleLineChange = (index: number, field: keyof CreateQuoteLineData | 'taxRate', value: string | number) => {
    setFormData(prev => {
      const next = [...prev.lines];
      (next[index] as any)[field] = field === 'quantity' || field === 'unitPrice' || field === 'taxRate' ? Number(value) : value;
      return { ...prev, lines: next };
    });
  };

  const handleSubmit = () => {
    if (formData.clientId === '' || formData.lines.some(l => !l.description.trim() || Number(l.unitPrice) < 0)) {
      return;
    }
    onSubmit({
      clientId: Number(formData.clientId),
      expiryDate: formData.expiryDate || undefined,
      lines: formData.lines.map(({ productId, description, quantity, unitPrice, taxRate }) => ({
        productId: productId ?? undefined,
        description: description.trim(),
        quantity: Number(quantity),
        unitPrice: Number(unitPrice),
        taxRate: Number(taxRate)
      }))
    });
    onClose();
  };

  const subtotal = formData.lines.reduce((s, l) => s + Number(l.quantity) * Number(l.unitPrice), 0);
  const tax = formData.lines.reduce((s, l) => s + Number(l.quantity) * Number(l.unitPrice) * Number(l.taxRate ?? 0), 0);
  const total = subtotal + tax;
  const totalHeures = formData.lines.reduce((s, l) => s + Number(l.quantity ?? 0), 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Nouveau devis</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Client</InputLabel>
            <Select
              value={formData.clientId}
              label="Client"
              onChange={e => setFormData(prev => ({ ...prev, clientId: e.target.value as number }))}
              disabled={loading}
            >
              {clients.map(c => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Validité (date limite)"
            type="date"
            value={formData.expiryDate}
            onChange={e => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 280 }}>
              <InputLabel>Ajouter un produit du catalogue</InputLabel>
              <Select
                value={selectedProductId}
                label="Ajouter un produit du catalogue"
                onChange={e => setSelectedProductId(e.target.value as number | '')}
              >
                <MenuItem value="">Sélectionner un produit...</MenuItem>
                {productsStore.products.map((p: any) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name} – {Number(p.unitPrice ?? 0).toFixed(2)} € HT
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button size="small" variant="contained" startIcon={<ShoppingCart />} onClick={handleAddProductAsLine} disabled={selectedProductId === ''}>
              Ajouter cette ligne
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Tu peux ajouter plusieurs produits : choisis un produit, clique sur &quot;Ajouter cette ligne&quot;, puis recommence pour un autre (ou le même).
          </Typography>
          <Typography variant="subtitle2">Lignes</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Qté</TableCell>
                  <TableCell align="right">Prix unit. HT</TableCell>
                  <TableCell align="right">TVA</TableCell>
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
                        onChange={e => handleLineChange(i, 'description', e.target.value)}
                        placeholder="Description"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        inputProps={{ min: 0.01, step: 1 }}
                        sx={{ width: 70 }}
                        value={line.quantity}
                        onChange={e => handleLineChange(i, 'quantity', e.target.value)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        inputProps={{ min: 0, step: 0.01 }}
                        sx={{ width: 100 }}
                        value={line.unitPrice !== undefined && line.unitPrice !== null ? line.unitPrice : ''}
                        onChange={e => handleLineChange(i, 'unitPrice', e.target.value)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        inputProps={{ min: 0, max: 1, step: 0.01 }}
                        sx={{ width: 80 }}
                        value={line.taxRate ?? 0.2}
                        onChange={e => handleLineChange(i, 'taxRate', e.target.value)}
                        placeholder="0.2"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleRemoveLine(i)} disabled={formData.lines.length <= 1}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Button startIcon={<Add />} onClick={handleAddLine} size="small">
            Ajouter une ligne
          </Button>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="body2">Total heures: {totalHeures}</Typography>
            <Typography variant="body2">Total HT: {subtotal.toFixed(2)} €</Typography>
            <Typography variant="body2">TVA: {tax.toFixed(2)} €</Typography>
            <Typography variant="body1" fontWeight="bold">TTC: {total.toFixed(2)} €</Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={formData.clientId === '' || formData.lines.some(l => !l.description.trim())}>
          Créer le devis
        </Button>
      </DialogActions>
    </Dialog>
  );
}
