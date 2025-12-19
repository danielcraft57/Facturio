import { useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
} from '@mui/material';
import { useStores } from '../hooks/useStores';

export function StoreDemo() {
  const { app, clients, invoices, dashboard, theme, syncAllData, clearAllCache } = useStores();

  useEffect(() => {
    // Charger les données au montage
    syncAllData();
  }, [syncAllData]);

  const handleToggleTheme = () => {
    theme.updateSettings({
      mode: theme.settings.mode === 'light' ? 'dark' : 'light'
    });
  };

  const handleChangePreset = (presetId: string) => {
    theme.setPreset(presetId);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Démonstration des Stores Zustand
      </Typography>

      {/* État global */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            État Global
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center" mb={2}>
            <Chip 
              label={app.isOnline ? 'En ligne' : 'Hors ligne'} 
              color={app.isOnline ? 'success' : 'error'}
            />
            <Chip 
                            label={app.loading ? 'Chargement...' : 'Prêt'}
              color={app.loading ? 'warning' : 'success'}
            />
            {app.lastSync && (
              <Chip 
                label={`Dernière sync: ${new Date(app.lastSync).toLocaleTimeString()}`}
                variant="outlined"
              />
            )}
          </Stack>
          <Stack direction="row" spacing={2}>
            <Button variant="contained" onClick={syncAllData} disabled={app.loading}>
              Synchroniser
            </Button>
            <Button variant="outlined" onClick={clearAllCache}>
              Vider le cache
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Thème */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Gestion du Thème
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center" mb={2}>
            <Chip 
              label={`Mode: ${theme.settings.mode}`} 
              color={theme.settings.mode === 'light' ? 'primary' : 'secondary'}
            />
            <Chip 
              label={`Densité: ${theme.settings.density}`} 
              variant="outlined"
            />
            <Chip 
              label={`Rayon: ${theme.settings.radius}px`} 
              variant="outlined"
            />
          </Stack>
          <Stack direction="row" spacing={2} mb={2}>
            <Button variant="contained" onClick={handleToggleTheme}>
              Basculer mode
            </Button>
            <Button variant="outlined" onClick={() => handleChangePreset('business')}>
              Business
            </Button>
            <Button variant="outlined" onClick={() => handleChangePreset('minimal')}>
              Minimal
            </Button>
            <Button variant="outlined" onClick={() => handleChangePreset('energique')}>
              Énergique
            </Button>
          </Stack>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Box 
              sx={{ 
                width: 24, 
                height: 24, 
                borderRadius: 1, 
                backgroundColor: theme.settings.primary 
              }} 
            />
            <Typography variant="body2">Couleur primaire</Typography>
            <Box 
              sx={{ 
                width: 24, 
                height: 24, 
                borderRadius: 1, 
                backgroundColor: theme.settings.secondary 
              }} 
            />
            <Typography variant="body2">Couleur secondaire</Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Données */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
        {/* Dashboard */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Dashboard
            </Typography>
            <Stack spacing={1}>
              <Chip 
                label={dashboard.isLoading ? 'Chargement...' : 'Prêt'} 
                color={dashboard.isLoading ? 'warning' : 'success'}
                size="small"
              />
              <Chip 
                label={dashboard.isStale ? 'Obsolète' : 'À jour'} 
                color={dashboard.isStale ? 'error' : 'success'}
                size="small"
              />
              {dashboard.stats && (
                <Typography variant="body2">
                  CA: {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(dashboard.stats.revenue.total)}
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Clients */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Clients
            </Typography>
            <Stack spacing={1}>
              <Chip 
                label={clients.isLoading ? 'Chargement...' : 'Prêt'} 
                color={clients.isLoading ? 'warning' : 'success'}
                size="small"
              />
              <Chip 
                label={`${clients.clients.length} clients`} 
                variant="outlined"
                size="small"
              />
              <Chip 
                label={clients.isStale ? 'Obsolète' : 'À jour'} 
                color={clients.isStale ? 'error' : 'success'}
                size="small"
              />
            </Stack>
          </CardContent>
        </Card>

        {/* Factures */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Factures
            </Typography>
            <Stack spacing={1}>
              <Chip 
                label={invoices.isLoading ? 'Chargement...' : 'Prêt'} 
                color={invoices.isLoading ? 'warning' : 'success'}
                size="small"
              />
              <Chip 
                label={`${invoices.invoices.length} factures`} 
                variant="outlined"
                size="small"
              />
              <Chip 
                label={invoices.isStale ? 'Obsolète' : 'À jour'} 
                color={invoices.isStale ? 'error' : 'success'}
                size="small"
              />
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {/* Notifications */}
      {app.notifications.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Notifications ({app.notifications.length})
            </Typography>
            <Stack spacing={1}>
              {app.notifications.map((notification) => (
                <Box key={notification.id} sx={{ p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight="bold">
                    {notification.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {notification.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Erreur */}
      {app.lastError && (
        <Card sx={{ mt: 3, borderColor: 'error.main' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="error">
              Erreur
            </Typography>
            <Stack spacing={1}>
              <Box sx={{ p: 1, border: 1, borderColor: 'error.main', borderRadius: 1 }}>
                <Typography variant="body2" fontWeight="bold" color="error">
                  {app.lastError.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {app.lastError.message}
                </Typography>
                                  <Typography variant="caption" color="text.secondary">
                    {app.lastError.timestamp ? new Date(app.lastError.timestamp).toLocaleTimeString() : 'Maintenant'}
                  </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
