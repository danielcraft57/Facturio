import React from 'react';
import { Box, Card, CardContent, Typography, Button, Chip, Stack } from '@mui/material';
import { useAppStore } from '../stores/appStore';

export const GlobalStateDemo: React.FC = () => {
  const appStore = useAppStore();

  const testNotification = () => {
    appStore.addNotification({
      type: 'success',
      title: 'Test de notification',
      message: 'Cette notification a été créée pour tester le système',
      duration: 5000,
    });
  };

  const testCacheExpiry = () => {
    appStore.setCacheExpiry('test-store', 5000);
    appStore.addNotification({
      type: 'info',
      title: 'Cache configuré',
      message: 'Le cache expirera dans 5 secondes',
      duration: 3000,
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Démonstration État Global Avancé
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Statut de l'application
          </Typography>
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography>Connectivité:</Typography>
              <Chip 
                label={appStore.isOnline ? 'En ligne' : 'Hors ligne'} 
                color={appStore.isOnline ? 'success' : 'error'}
                size="small"
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography>Onglet principal:</Typography>
              <Chip 
                label={appStore.isPrimaryTab ? 'Oui' : 'Non'} 
                color={appStore.isPrimaryTab ? 'primary' : 'default'}
                size="small"
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography>Autres onglets:</Typography>
              <Chip 
                label={appStore.otherTabs.length.toString()} 
                color="info"
                size="small"
              />
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Actions de test
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" onClick={testNotification}>
              Test notification
            </Button>
            <Button variant="outlined" onClick={testCacheExpiry}>
              Test cache expiry
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
