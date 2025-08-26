import { useCallback } from 'react';
import { useAppStore } from '../stores/appStore';
import { useClientsStore } from '../stores/clientsStore';
import { useInvoicesStore } from '../stores/invoicesStore';
import { useDashboardStore } from '../stores/dashboardStore';
import { useThemeStore } from '../stores/themeStore';

// Hook pour utiliser tous les stores de manière optimisée
export const useStores = () => {
  // Store principal
  const appStore = useAppStore();
  
  // Stores métier
  const clientsStore = useClientsStore();
  const invoicesStore = useInvoicesStore();
  const dashboardStore = useDashboardStore();
  const themeStore = useThemeStore();

  // Actions combinées pour la synchronisation
  const syncAllData = useCallback(async () => {
    appStore.setLoading(true, 'Synchronisation des données...');
    
    try {
      await Promise.all([
        dashboardStore.fetchStats(),
        clientsStore.fetchClients(),
        invoicesStore.fetchInvoices(),
      ]);
      
      appStore.setLastSync(new Date());
      appStore.addNotification({
        type: 'success',
        title: 'Synchronisation réussie',
        message: 'Toutes les données ont été mises à jour',
        duration: 3000,
      });
    } catch (error) {
      appStore.addError({
        type: 'api',
        title: 'Erreur de synchronisation',
        message: 'Impossible de synchroniser les données',
        details: error,
      });
    } finally {
      appStore.setLoading(false);
    }
  }, [appStore, dashboardStore, clientsStore, invoicesStore]);

  // Actions combinées pour le nettoyage
  const clearAllCache = useCallback(() => {
    clientsStore.clearCache();
    invoicesStore.clearCache();
    dashboardStore.clearCache();
    
    appStore.addNotification({
      type: 'info',
      title: 'Cache vidé',
      message: 'Toutes les données en cache ont été supprimées',
      duration: 3000,
    });
  }, [appStore, clientsStore, invoicesStore, dashboardStore]);

  // Actions combinées pour marquer comme obsolète
  const markAllAsStale = useCallback(() => {
    clientsStore.markAsStale();
    invoicesStore.markAsStale();
    dashboardStore.markAsStale();
  }, [clientsStore, invoicesStore, dashboardStore]);

  return {
    // Stores
    app: appStore,
    clients: clientsStore,
    invoices: invoicesStore,
    dashboard: dashboardStore,
    theme: themeStore,
    
    // Actions combinées
    syncAllData,
    clearAllCache,
    markAllAsStale,
  };
};

// Hook pour utiliser uniquement le store principal
export const useApp = () => useAppStore();

// Hook pour utiliser uniquement le store des clients
export const useClients = () => useClientsStore();

// Hook pour utiliser uniquement le store des factures
export const useInvoices = () => useInvoicesStore();

// Hook pour utiliser uniquement le store du dashboard
export const useDashboard = () => useDashboardStore();

// Hook pour utiliser uniquement le store du thème
export const useTheme = () => useThemeStore();
