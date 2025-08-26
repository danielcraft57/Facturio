import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import type { Product, ProductKind, ProductPurpose, UpdateProductData } from '../../../types/product';

type Props = {
  open: boolean;
  product: Product | null;
  onClose: () => void;
  onSave: (data: UpdateProductData) => Promise<void> | void;
  isSaving?: boolean;
};

export function EditProductDialog({ open, product, onClose, onSave, isSaving }: Props) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [kind, setKind] = useState<ProductKind>('SERVICE');
  const [purpose, setPurpose] = useState<ProductPurpose | ''>('');
  const [unitPrice, setUnitPrice] = useState<number | ''>('');
  const [estimatedHours, setEstimatedHours] = useState<number | ''>('');
  const [languages, setLanguages] = useState('');

  const [errors, setErrors] = useState<{ [k: string]: string }>({});

  useEffect(() => {
    if (open && product) {
      setName(product.name || '');
      setSku(product.sku || '');
      setKind(product.kind || 'SERVICE');
      setPurpose(product.purpose || '');
      setUnitPrice(product.unitPrice ?? '');
      setEstimatedHours(product.estimatedHours ?? '');
      setLanguages((product.languages || []).join(', '));
      setErrors({});
    }
  }, [open, product]);

  const isValid = useMemo(() => {
    const e: { [k: string]: string } = {};
    if (!name.trim()) e.name = 'Nom requis';
    if (!kind) e.kind = 'Type requis';
    if (unitPrice === '' || Number(unitPrice) < 0) e.unitPrice = 'Prix invalide';
    if (estimatedHours !== '' && Number(estimatedHours) < 0) e.estimatedHours = 'Heures invalides';
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [name, kind, unitPrice, estimatedHours]);

  const handleSave = async () => {
    if (!isValid) return;
    const data: UpdateProductData = {
      name: name.trim(),
      sku: sku.trim() || undefined,
      kind,
      purpose: purpose || undefined,
      unitPrice: unitPrice === '' ? undefined : Number(unitPrice),
      estimatedHours: estimatedHours === '' ? undefined : Number(estimatedHours),
      languages: languages
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
    };
    await onSave(data);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Modifier le produit</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mt: 1 }}>
          <TextField
            label="Nom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            fullWidth
          />
          <TextField label="SKU" value={sku} onChange={(e) => setSku(e.target.value)} fullWidth />

          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select label="Type" value={kind} onChange={(e) => setKind(e.target.value as ProductKind)}>
              <MenuItem value="SAAS">SAAS</MenuItem>
              <MenuItem value="APP">APP</MenuItem>
              <MenuItem value="SERVICE">SERVICE</MenuItem>
              <MenuItem value="GOOD">GOOD</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>But</InputLabel>
            <Select label="But" value={purpose} onChange={(e) => setPurpose(e.target.value as ProductPurpose | '')}>
              <MenuItem value="">Non défini</MenuItem>
              <MenuItem value="WEBSITE">WEBSITE</MenuItem>
              <MenuItem value="SAAS">SAAS</MenuItem>
              <MenuItem value="ECOMMERCE">ECOMMERCE</MenuItem>
              <MenuItem value="SHOWCASE">SHOWCASE</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Prix unitaire (€)"
            type="number"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value === '' ? '' : Number(e.target.value))}
            error={!!errors.unitPrice}
            helperText={errors.unitPrice}
            fullWidth
            inputProps={{ min: 0, step: 0.01 }}
          />

          <TextField
            label="Heures estimées"
            type="number"
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(e.target.value === '' ? '' : Number(e.target.value))}
            error={!!errors.estimatedHours}
            helperText={errors.estimatedHours}
            fullWidth
            inputProps={{ min: 0, step: 1 }}
          />

          <TextField
            label="Langages (séparés par des virgules)"
            value={languages}
            onChange={(e) => setLanguages(e.target.value)}
            fullWidth
            sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button onClick={handleSave} variant="contained" disabled={isSaving || !isValid}>
          Enregistrer
        </Button>
      </DialogActions>
    </Dialog>
  );
}


