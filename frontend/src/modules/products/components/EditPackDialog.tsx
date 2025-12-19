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
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ViewModule as TemplateIcon,
  Add as AddIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';
import type { Pack, CreatePackData, UpdatePackData, PackType } from '../../../types/pack';
import { MOCK_PRODUCTS } from '../../../services/productService.mock';
import { PackTemplateSelector } from './PackTemplateSelector';

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
    products: [],
    features: [],
    deliveryTime: 15
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);
  const [customFeature, setCustomFeature] = useState('');

  // Initialiser le formulaire avec les données du pack existant
  useEffect(() => {
    if (pack) {
      setFormData({
        name: pack.name,
        type: pack.type,
        description: pack.description,
        details: pack.details,
        products: pack.products,
        features: pack.features || [],
        deliveryTime: pack.deliveryTime || 15
      });
    } else {
      setFormData({
        name: '',
        type: 'WEBSITE',
        description: '',
        details: '',
        products: [],
        features: [],
        deliveryTime: 15
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

  const handleTemplateSelect = (template: any) => {
    setFormData(prev => ({
      ...prev,
      name: template.name,
      type: template.type,
      description: template.description,
      details: template.details,
      products: template.suggestedProducts,
      features: template.features,
      deliveryTime: template.deliveryTime
    }));
    setTemplateSelectorOpen(false);
  };

  const handleAddFeature = () => {
    if (customFeature.trim() && !formData.features?.includes(customFeature.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...(prev.features || []), customFeature.trim()]
      }));
      setCustomFeature('');
    }
  };

  const handleRemoveFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features?.filter(f => f !== feature) || []
    }));
  };

  const selectedProducts = MOCK_PRODUCTS.filter((p: any) => formData.products.includes(p.id));
  const totalHours = selectedProducts.reduce((sum, p) => sum + (p.estimatedHours || 0), 0);
  const totalPrice = selectedProducts.reduce((sum, p) => sum + (p.unitPrice || 0), 0);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {pack ? 'Modifier le pack' : 'Nouveau pack'}
            </Typography>
            {!pack && (
              <Tooltip title="Utiliser un template">
                <IconButton 
                  onClick={() => setTemplateSelectorOpen(true)}
                  color="primary"
                  size="small"
                >
                  <TemplateIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
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

            {/* Délai de livraison */}
            <TextField
              label="Délai de livraison (jours)"
              type="number"
              value={formData.deliveryTime}
              onChange={(e) => setFormData(prev => ({ ...prev, deliveryTime: parseInt(e.target.value) || 15 }))}
              fullWidth
              inputProps={{ min: 1, max: 365 }}
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Fonctionnalités */}
          <Typography variant="h6" gutterBottom>
            Fonctionnalités incluses
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                label="Ajouter une fonctionnalité"
                value={customFeature}
                onChange={(e) => setCustomFeature(e.target.value)}
                size="small"
                sx={{ flexGrow: 1 }}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
              />
              <Button
                variant="outlined"
                onClick={handleAddFeature}
                disabled={!customFeature.trim()}
                startIcon={<AddIcon />}
              >
                Ajouter
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {formData.features?.map((feature, index) => (
                <Chip
                  key={index}
                  label={feature}
                  onDelete={() => handleRemoveFeature(feature)}
                  deleteIcon={<RemoveIcon />}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
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
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <Chip label={`${selectedProducts.length} produits`} color="primary" />
                <Chip label={`${totalHours}h total`} color="secondary" />
                <Chip label={`${totalPrice.toLocaleString('fr-FR')}€`} color="success" />
                <Chip label={`${formData.deliveryTime} jours`} color="info" />
              </Box>
              {formData.features && formData.features.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Fonctionnalités ({formData.features.length}) :
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formData.features.join(', ')}
                  </Typography>
                </Box>
              )}
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

    {/* Sélecteur de templates */}
    <PackTemplateSelector
      open={templateSelectorOpen}
      onClose={() => setTemplateSelectorOpen(false)}
      onSelectTemplate={handleTemplateSelect}
    />
    </>
  );
};
