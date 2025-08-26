import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  Chip,
  Divider
} from '@mui/material';
import type { Pack, CreatePackData, UpdatePackData, PackType } from '../../../types/pack';
import { MOCK_PRODUCTS } from '../../../services/productService.mock';

interface EditPackDialogProps {
  open: boolean;
  pack?: Pack | null;
  onClose: () => void;
  onSave: (data: CreatePackData | UpdatePackData) => Promise<void>;
  loading?: boolean;
}

const PACK_TYPES: { value: PackType; label: string }[] = [
  { value: 'WEBSITE', label: 'Site Web' },
  { value: 'ECOMMERCE', label: 'E-commerce' },
  { value: 'SAAS', label: 'SaaS' }
];

export const EditPackDialog: React.FC<EditPackDialogProps> = ({
  open,
  pack,
  onClose,
  onSave,
  loading = false
}) => {
  const [formData, setFormData] = useState<CreatePackData>({
    name: '',
    type: 'WEBSITE',
    description: '',
    details: '',
    products: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialiser le formulaire avec les données du pack existant
  useEffect(() => {
    if (pack) {
      setFormData({
        name: pack.name,
        type: pack.type,
        description: pack.description,
        details: pack.details,
        products: pack.products
      });
    } else {
      setFormData({
        name: '',
        type: 'WEBSITE',
        description: '',
        details: '',
        products: []
      });
    }
    setErrors({});
  }, [pack, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise';
    }

    if (!formData.details.trim()) {
      newErrors.details = 'Les détails sont requis';
    }

    if (formData.products.length === 0) {
      newErrors.products = 'Sélectionnez au moins un produit';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du pack:', error);
    }
  };

  const handleProductToggle = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.includes(productId)
        ? prev.products.filter(id => id !== productId)
        : [...prev.products, productId]
    }));
  };

  const selectedProducts = MOCK_PRODUCTS.filter((p: any) => formData.products.includes(p.id));
  const totalHours = selectedProducts.reduce((sum, p) => sum + (p.estimatedHours || 0), 0);
  const totalPrice = selectedProducts.reduce((sum, p) => sum + (p.unitPrice || 0), 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {pack ? 'Modifier le pack' : 'Nouveau pack'}
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr' }}>
            {/* Nom */}
            <TextField
              label="Nom du pack"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              error={!!errors.name}
              helperText={errors.name}
              fullWidth
              required
            />

            {/* Type */}
            <FormControl fullWidth required>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as PackType }))}
                label="Type"
              >
                {PACK_TYPES.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Description */}
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              error={!!errors.description}
              helperText={errors.description}
              fullWidth
              required
              sx={{ gridColumn: '1 / -1' }}
            />

            {/* Détails */}
            <TextField
              label="Détails"
              value={formData.details}
              onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
              error={!!errors.details}
              helperText={errors.details}
              fullWidth
              multiline
              rows={4}
              required
              sx={{ gridColumn: '1 / -1' }}
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Sélection des produits */}
          <Typography variant="h6" gutterBottom>
            Produits inclus
          </Typography>
          
          {errors.products && (
            <Typography color="error" variant="caption" sx={{ mb: 1, display: 'block' }}>
              {errors.products}
            </Typography>
          )}

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {MOCK_PRODUCTS.map((product: any) => (
              <Box
                key={product.id}
                sx={{
                  border: '1px solid',
                  borderColor: formData.products.includes(product.id) ? 'primary.main' : 'divider',
                  borderRadius: 1,
                  p: 2,
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover'
                  }
                }}
                onClick={() => handleProductToggle(product.id)}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.products.includes(product.id)}
                      onChange={() => handleProductToggle(product.id)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {product.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {product.sku} • {product.estimatedHours}h • {product.unitPrice.toLocaleString('fr-FR')}€
                      </Typography>
                    </Box>
                  }
                  sx={{ width: '100%', m: 0 }}
                />
              </Box>
            ))}
          </Box>

          {/* Résumé */}
          {selectedProducts.length > 0 && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>
                Résumé du pack
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip label={`${selectedProducts.length} produits`} color="primary" />
                <Chip label={`${totalHours}h total`} color="secondary" />
                <Chip label={`${totalPrice.toLocaleString('fr-FR')}€`} color="success" />
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Sauvegarde...' : (pack ? 'Modifier' : 'Créer')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
