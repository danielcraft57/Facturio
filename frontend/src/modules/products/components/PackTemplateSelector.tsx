import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Chip,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import {
  Web as WebIcon,
  ShoppingCart as ShoppingCartIcon,
  Cloud as CloudIcon,
  Star as StarIcon,
  AccessTime as AccessTimeIcon,
  Euro as EuroIcon
} from '@mui/icons-material';
import { getTemplatesByType, getPopularTemplates } from '../../../data/packTemplates';
import type { PackTemplate, PackType } from '../../../types/pack';

interface PackTemplateSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelectTemplate: (template: PackTemplate) => void;
}

const getTypeIcon = (type: PackType) => {
  switch (type) {
    case 'WEBSITE': return <WebIcon />;
    case 'ECOMMERCE': return <ShoppingCartIcon />;
    case 'SAAS': return <CloudIcon />;
    default: return <WebIcon />;
  }
};

const getTypeColor = (type: PackType) => {
  switch (type) {
    case 'WEBSITE': return 'primary';
    case 'ECOMMERCE': return 'success';
    case 'SAAS': return 'info';
    default: return 'primary';
  }
};

export const PackTemplateSelector: React.FC<PackTemplateSelectorProps> = ({
  open,
  onClose,
  onSelectTemplate
}) => {
  const [selectedType, setSelectedType] = useState<PackType | 'POPULAR'>('POPULAR');

  const handleTypeChange = (_event: React.SyntheticEvent, newValue: PackType | 'POPULAR') => {
    setSelectedType(newValue);
  };

  const getTemplatesToShow = () => {
    if (selectedType === 'POPULAR') {
      return getPopularTemplates();
    }
    return getTemplatesByType(selectedType);
  };

  const templates = getTemplatesToShow();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Typography variant="h6" gutterBottom>
          Choisir un template de pack
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sélectionnez un template prédéfini pour créer rapidement votre pack
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Tabs value={selectedType} onChange={handleTypeChange} sx={{ mb: 3 }}>
          <Tab 
            value="POPULAR" 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StarIcon fontSize="small" />
                Populaires
              </Box>
            } 
          />
          <Tab 
            value="WEBSITE" 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WebIcon fontSize="small" />
                Sites Web
              </Box>
            } 
          />
          <Tab 
            value="ECOMMERCE" 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShoppingCartIcon fontSize="small" />
                E-commerce
              </Box>
            } 
          />
          <Tab 
            value="SAAS" 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CloudIcon fontSize="small" />
                SaaS
              </Box>
            } 
          />
        </Tabs>

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: 3 
        }}>
          {templates.map((template) => (
            <Card 
              key={template.id}
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s ease-in-out'
                }
              }}
              onClick={() => onSelectTemplate(template)}
            >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    {getTypeIcon(template.type)}
                    <Typography variant="h6" component="h3">
                      {template.name}
                    </Typography>
                    {template.isPopular && (
                      <Chip 
                        icon={<StarIcon />} 
                        label="Populaire" 
                        size="small" 
                        color="warning" 
                      />
                    )}
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {template.description}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Fonctionnalités incluses :
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {template.features.slice(0, 3).map((feature, index) => (
                        <Chip 
                          key={index} 
                          label={feature} 
                          size="small" 
                          variant="outlined"
                          color={getTypeColor(template.type)}
                        />
                      ))}
                      {template.features.length > 3 && (
                        <Chip 
                          label={`+${template.features.length - 3} autres`} 
                          size="small" 
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTimeIcon fontSize="small" color="action" />
                      <Typography variant="caption">
                        {template.estimatedHours}h
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EuroIcon fontSize="small" color="action" />
                      <Typography variant="h6" color="primary">
                        {template.estimatedPrice.toLocaleString('fr-FR')}€
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <AccessTimeIcon fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      Livraison en {template.deliveryTime} jours
                    </Typography>
                  </Box>
                </CardContent>

                <CardActions>
                  <Button 
                    variant="contained" 
                    fullWidth
                    color={getTypeColor(template.type)}
                  >
                    Utiliser ce template
                  </Button>
                </CardActions>
              </Card>
            ))}
        </Box>

        {templates.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              Aucun template disponible pour ce type
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Annuler
        </Button>
      </DialogActions>
    </Dialog>
  );
};
