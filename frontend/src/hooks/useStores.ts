import { useCallback } from 'react';
import { useAppStore } from '../stores/appStore';
import { useClientsStore } from '../stores/clientsStore';
import { useInvoicesStore } from '../stores/invoicesStore';
import { useQuotesStore } from '../stores/quotesStore';
import { useDashboardStore } from '../stores/dashboardStore';
import { useProductsStore } from '../stores/productsStore';
import { useThemeStore } from '../stores/themeStore';

// Hook pour utiliser tous les stores de manière optimisée
export const useStores = () => {
  // Store principal
  const appStore = useAppStore();
  
  // Stores métier
  const clientsStore = useClientsStore();
  const invoicesStore = useInvoicesStore();
  const quotesStore = useQuotesStore();
  const productsStore = useProductsStore();
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
        quotesStore.fetchQuotes(),
        productsStore.fetchProducts(),
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
  }, [appStore, dashboardStore, clientsStore, invoicesStore, quotesStore, productsStore]);

  // Actions combinées pour le nettoyage
  const clearAllCache = useCallback(() => {
    clientsStore.clearCache();
    invoicesStore.clearCache();
    quotesStore.clearCache();
    productsStore.clearCache();
    dashboardStore.clearCache();
    
    appStore.addNotification({
      type: 'info',
      title: 'Cache vidé',
      message: 'Toutes les données en cache ont été supprimées',
      duration: 3000,
    });
  }, [appStore, clientsStore, invoicesStore, quotesStore, productsStore, dashboardStore]);

  // Actions combinées pour marquer comme obsolète
  const markAllAsStale = useCallback(() => {
    clientsStore.markAsStale();
    invoicesStore.markAsStale();
    quotesStore.markAsStale();
    productsStore.markAsStale();
    dashboardStore.markAsStale();
  }, [clientsStore, invoicesStore, quotesStore, productsStore, dashboardStore]);

  return {
    // Stores
    app: appStore,
    clients: clientsStore,
    invoices: invoicesStore,
    quotes: quotesStore,
    products: productsStore,
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

// Hook pour utiliser uniquement le store des devis
export const useQuotes = () => useQuotesStore();

// Hook pour utiliser uniquement le store des produits
export const useProducts = () => useProductsStore();

// Hook pour utiliser uniquement le store du dashboard
export const useDashboard = () => useDashboardStore();

// Hook pour utiliser uniquement le store du thème
export const useTheme = () => useThemeStore();
