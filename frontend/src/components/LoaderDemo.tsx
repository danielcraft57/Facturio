import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
} from '@mui/material';
import { PageLoader } from './PageLoader';
import { AdvancedPageLoader, ModernPageLoader } from './AdvancedPageLoader';

export const LoaderDemo: React.FC = () => {
  const [loaderType, setLoaderType] = useState<'basic' | 'modern' | 'shimmer' | 'gradient' | 'pulse' | 'dots'>('modern');
  const [color, setColor] = useState<'primary' | 'secondary' | 'rainbow'>('primary');
  const [height, setHeight] = useState(3);
  const [duration, setDuration] = useState(800);
  const [isVisible, setIsVisible] = useState(false);

  const triggerLoader = () => {
    setIsVisible(true);
    setTimeout(() => setIsVisible(false), duration + 500);
  };

  const renderLoader = () => {
    switch (loaderType) {
      case 'basic':
        return (
          <PageLoader
            color={color === 'rainbow' ? 'primary' : color}
            height={height}
            duration={duration}
          />
        );
      case 'modern':
        return (
          <ModernPageLoader
            height={height}
            duration={duration}
            color={color}
          />
        );
      default:
        return (
          <AdvancedPageLoader
            variant={loaderType as any}
            height={height}
            duration={duration}
            color={color}
          />
        );
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Démonstration des Loaders
      </Typography>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        {/* Contrôles */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Configuration
            </Typography>
            
            <Stack spacing={3}>
              <FormControl fullWidth>
                <InputLabel>Type de loader</InputLabel>
                <Select
                  value={loaderType}
                  label="Type de loader"
                  onChange={(e) => setLoaderType(e.target.value as any)}
                >
                  <MenuItem value="basic">Basique</MenuItem>
                  <MenuItem value="modern">Moderne</MenuItem>
                  <MenuItem value="shimmer">Shimmer</MenuItem>
                  <MenuItem value="gradient">Gradient</MenuItem>
                  <MenuItem value="pulse">Pulse</MenuItem>
                  <MenuItem value="dots">Points</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Couleur</InputLabel>
                <Select
                  value={color}
                  label="Couleur"
                  onChange={(e) => setColor(e.target.value as any)}
                >
                  <MenuItem value="primary">Primaire</MenuItem>
                  <MenuItem value="secondary">Secondaire</MenuItem>
                  <MenuItem value="rainbow">Arc-en-ciel</MenuItem>
                </Select>
              </FormControl>

              <Box>
                <Typography gutterBottom>Hauteur: {height}px</Typography>
                <Slider
                  value={height}
                  onChange={(_, value) => setHeight(value as number)}
                  min={1}
                  max={10}
                  marks
                  valueLabelDisplay="auto"
                />
              </Box>

              <Box>
                <Typography gutterBottom>Durée: {duration}ms</Typography>
                <Slider
                  value={duration}
                  onChange={(_, value) => setDuration(value as number)}
                  min={200}
                  max={2000}
                  step={100}
                  marks
                  valueLabelDisplay="auto"
                />
              </Box>

              <Button 
                variant="contained" 
                onClick={triggerLoader}
                fullWidth
                size="large"
              >
                Tester le loader
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Prévisualisation */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Prévisualisation
            </Typography>
            
            <Box sx={{ 
              border: 2, 
              borderColor: 'divider', 
              borderRadius: 1, 
              p: 2, 
              minHeight: 200,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Cliquez sur "Tester le loader" pour voir l'animation
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">
                  Type: {loaderType}
                </Typography>
                <Typography variant="subtitle2">
                  Couleur: {color}
                </Typography>
                <Typography variant="subtitle2">
                  Hauteur: {height}px
                </Typography>
                <Typography variant="subtitle2">
                  Durée: {duration}ms
                </Typography>
              </Box>

              {/* Zone de test du loader */}
              <Box sx={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                height: height,
                overflow: 'hidden'
              }}>
                {isVisible && renderLoader()}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Description des types */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Types de loaders disponibles
          </Typography>
          
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">Basique</Typography>
              <Typography variant="body2" color="text.secondary">
                Barre de progression simple avec animation fluide
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">Moderne</Typography>
              <Typography variant="body2" color="text.secondary">
                Barre avec gradient et effet de brillance
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">Shimmer</Typography>
              <Typography variant="body2" color="text.secondary">
                Effet de scintillement qui traverse la barre
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">Gradient</Typography>
              <Typography variant="body2" color="text.secondary">
                Gradient animé avec déplacement de couleurs
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">Pulse</Typography>
              <Typography variant="body2" color="text.secondary">
                Animation de pulsation avec ombre portée
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">Points</Typography>
              <Typography variant="body2" color="text.secondary">
                Trois points qui pulsent en séquence
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
