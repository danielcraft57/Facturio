import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

// Types pour l'état global
export interface AppState {
  // État de l'application
  loading: boolean;
  loadingMessage: string | null;
  isOnline: boolean;
  lastSync: Date | null;
  lastError: AppError | null;
  
  // Notifications
  notifications: Notification[];
  
  // Cache et synchronisation
  cacheVersion: string;
  cacheExpiry: Record<string, number>; // Timestamp d'expiration par store
  syncInProgress: boolean;
  lastCacheCleanup: number;
  
  // Multi-onglets
  tabId: string;
  isPrimaryTab: boolean;
  otherTabs: string[];
  
  // Actions
  setLoading: (loading: boolean, message?: string) => void;
  setOnline: (online: boolean) => void;
  setLastSync: (date: Date) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setError: (error: AppError | null) => void;
  clearError: () => void;
  
  // Cache management
  setCacheExpiry: (storeName: string, expiryMs: number) => void;
  isCacheValid: (storeName: string) => boolean;
  invalidateCache: (storeName?: string) => void;
  cleanupCache: () => void;
  
  // Synchronisation
  startSync: () => void;
  endSync: () => void;
  
  // Multi-onglets
  registerTab: () => void;
  unregisterTab: () => void;
  notifyOtherTabs: (event: string, data?: any) => void;
  handleTabEvent: (event: string, data?: any) => void;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  timestamp: Date;
  read?: boolean;
}

export interface AppError {
  type: 'api' | 'network' | 'validation' | 'auth' | 'unknown';
  title: string;
  message: string;
  details?: any;
  timestamp?: Date;
  retryable: boolean;
}

// Configuration
const CACHE_VERSION = '1.0.0';
const CACHE_CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24h
const TAB_HEARTBEAT_INTERVAL = 5000; // 5s
const TAB_TIMEOUT = 10000; // 10s

// Générer un ID unique pour cet onglet
const generateTabId = () => `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useAppStore = create<AppState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // État initial
        loading: false,
        loadingMessage: null,
        isOnline: navigator.onLine,
        lastSync: null,
        lastError: null,
        notifications: [],
        cacheVersion: CACHE_VERSION,
        cacheExpiry: {},
        syncInProgress: false,
        lastCacheCleanup: Date.now(),
        tabId: generateTabId(),
        isPrimaryTab: false,
        otherTabs: [],

        // Actions de base
        setLoading: (loading, message) => {
          set({ loading, loadingMessage: message || null });
        },

        setOnline: (online) => {
          set({ isOnline: online });
          if (online) {
            // Tentative de synchronisation automatique
            const { lastSync } = get();
            const timeSinceLastSync = lastSync ? Date.now() - lastSync.getTime() : Infinity;
            if (timeSinceLastSync > 5 * 60 * 1000) { // 5 minutes
              get().startSync();
            }
          }
        },

        setLastSync: (date) => {
          set({ lastSync: date });
        },

        addNotification: (notification) => {
          const newNotification: Notification = {
            ...notification,
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
            read: false,
          };

          set((state) => ({
            notifications: [newNotification, ...state.notifications].slice(0, 50), // Limiter à 50 notifications
          }));

          // Auto-suppression si durée spécifiée
          if (notification.duration) {
            setTimeout(() => {
              get().removeNotification(newNotification.id);
            }, notification.duration);
          }
        },

        removeNotification: (id) => {
          set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
          }));
        },

        clearNotifications: () => {
          set({ notifications: [] });
        },

        setError: (error) => {
          const appError: AppError | null = error ? {
            ...error,
            timestamp: error.timestamp || new Date(),
          } : null;
          set({ lastError: appError });
        },

        clearError: () => {
          set({ lastError: null });
        },

        // Gestion du cache
        setCacheExpiry: (storeName, expiryMs) => {
          set((state) => ({
            cacheExpiry: {
              ...state.cacheExpiry,
              [storeName]: Date.now() + expiryMs,
            },
          }));
        },

        isCacheValid: (storeName) => {
          const { cacheExpiry } = get();
          const expiry = cacheExpiry[storeName];
          return expiry ? Date.now() < expiry : false;
        },

        invalidateCache: (storeName) => {
          if (storeName) {
            set((state) => ({
              cacheExpiry: {
                ...state.cacheExpiry,
                [storeName]: 0, // Expire immédiatement
              },
            }));
          } else {
            set({ cacheExpiry: {} }); // Invalider tout le cache
          }
        },

        cleanupCache: () => {
          const { cacheExpiry, lastCacheCleanup } = get();
          const now = Date.now();

          // Nettoyage périodique
          if (now - lastCacheCleanup > CACHE_CLEANUP_INTERVAL) {
            const validExpiry: Record<string, number> = {};
            
            Object.entries(cacheExpiry).forEach(([store, expiry]) => {
              if (expiry > now) {
                validExpiry[store] = expiry;
              }
            });

            set({ 
              cacheExpiry: validExpiry,
              lastCacheCleanup: now,
            });
          }
        },

        // Synchronisation
        startSync: () => {
          set({ syncInProgress: true });
        },

        endSync: () => {
          set({ syncInProgress: false });
        },

        // Multi-onglets
        registerTab: () => {
          const { tabId } = get();
          
          // Stocker l'ID de l'onglet dans localStorage
          localStorage.setItem('facturio_tabs', JSON.stringify({
            ...JSON.parse(localStorage.getItem('facturio_tabs') || '{}'),
            [tabId]: Date.now(),
          }));

          // Déterminer si c'est l'onglet principal
          const tabs = JSON.parse(localStorage.getItem('facturio_tabs') || '{}');
          const tabIds = Object.keys(tabs).sort((a, b) => tabs[a] - tabs[b]);
          const isPrimary = tabIds[0] === tabId;

          set({ 
            isPrimaryTab: isPrimary,
            otherTabs: tabIds.filter(id => id !== tabId),
          });

          // Heartbeat pour maintenir l'onglet actif
          const heartbeat = setInterval(() => {
            const tabs = JSON.parse(localStorage.getItem('facturio_tabs') || '{}');
            if (tabs[tabId]) {
              tabs[tabId] = Date.now();
              localStorage.setItem('facturio_tabs', JSON.stringify(tabs));
            } else {
              clearInterval(heartbeat);
            }
          }, TAB_HEARTBEAT_INTERVAL);

          // Nettoyer les onglets inactifs
          const cleanup = setInterval(() => {
            const tabs = JSON.parse(localStorage.getItem('facturio_tabs') || '{}');
            const now = Date.now();
            const activeTabs: Record<string, number> = {};

            Object.entries(tabs).forEach(([id, timestamp]) => {
              if (now - (timestamp as number) < TAB_TIMEOUT) {
                activeTabs[id] = timestamp as number;
              }
            });

            localStorage.setItem('facturio_tabs', JSON.stringify(activeTabs));
            
            // Mettre à jour la liste des autres onglets
            const tabIds = Object.keys(activeTabs).filter(id => id !== tabId);
            set({ otherTabs: tabIds });
          }, TAB_HEARTBEAT_INTERVAL);

          // Nettoyer les intervalles à la fermeture
          window.addEventListener('beforeunload', () => {
            clearInterval(heartbeat);
            clearInterval(cleanup);
            get().unregisterTab();
          });
        },

        unregisterTab: () => {
          const { tabId } = get();
          const tabs = JSON.parse(localStorage.getItem('facturio_tabs') || '{}');
          delete tabs[tabId];
          localStorage.setItem('facturio_tabs', JSON.stringify(tabs));
        },

        notifyOtherTabs: (event, data) => {
          const { tabId } = get();
          const message = {
            event,
            data,
            from: tabId,
            timestamp: Date.now(),
          };

          // Utiliser BroadcastChannel si disponible
          if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel('facturio_sync');
            channel.postMessage(message);
            channel.close();
          } else {
            // Fallback avec localStorage
            localStorage.setItem('facturio_messages', JSON.stringify({
              ...JSON.parse(localStorage.getItem('facturio_messages') || '{}'),
              [Date.now()]: message,
            }));
          }
        },

        handleTabEvent: (event, data) => {
          switch (event) {
            case 'cache_invalidated':
              // Invalider le cache local
              get().invalidateCache(data?.storeName);
              get().addNotification({
                type: 'info',
                title: 'Cache mis à jour',
                message: 'Les données ont été synchronisées depuis un autre onglet',
                duration: 3000,
              });
              break;

            case 'data_updated':
              // Forcer le rechargement des données
              get().addNotification({
                type: 'info',
                title: 'Données mises à jour',
                message: 'Nouvelles données disponibles depuis un autre onglet',
                duration: 3000,
              });
              break;

            case 'sync_started':
              get().setLoading(true, 'Synchronisation en cours...');
              break;

            case 'sync_completed':
              get().setLoading(false);
              get().setLastSync(new Date());
              break;
          }
        },
      }),
      {
        name: 'app-store',
        partialize: (state) => ({
          cacheVersion: state.cacheVersion,
          cacheExpiry: state.cacheExpiry,
          lastCacheCleanup: state.lastCacheCleanup,
          tabId: state.tabId,
          isPrimaryTab: state.isPrimaryTab,
          otherTabs: state.otherTabs,
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            // Initialiser la gestion multi-onglets
            state.registerTab();

            // Écouter les événements des autres onglets
            if (typeof BroadcastChannel !== 'undefined') {
              const channel = new BroadcastChannel('facturio_sync');
              channel.onmessage = (event) => {
                const { event: eventName, data, from } = event.data;
                if (from !== state.tabId) {
                  state.handleTabEvent(eventName, data);
                }
              };
            } else {
              // Fallback avec polling localStorage
              setInterval(() => {
                const messages = JSON.parse(localStorage.getItem('facturio_messages') || '{}');
                const now = Date.now();
                const newMessages: Record<string, any> = {};

                Object.entries(messages).forEach(([timestamp, message]) => {
                  const msgTime = parseInt(timestamp);
                  const msg = message as any;
                  if (msgTime > now - 1000 && msg.from !== state.tabId) {
                    state.handleTabEvent(msg.event, msg.data);
                  } else if (msgTime > now - 5000) {
                    newMessages[timestamp] = message;
                  }
                });

                localStorage.setItem('facturio_messages', JSON.stringify(newMessages));
              }, 1000);
            }

            // Écouter les changements de connectivité
            window.addEventListener('online', () => state.setOnline(true));
            window.addEventListener('offline', () => state.setOnline(false));

            // Nettoyage périodique du cache
            setInterval(() => {
              state.cleanupCache();
            }, 60000); // Toutes les minutes
          }
        },
      }
    )
  )
);

// Hook pour utiliser l'état global avec sélecteur optimisé
export const useApp = <T>(selector: (state: AppState) => T) => {
  return useAppStore(selector);
};

// Hooks spécialisés pour des parties spécifiques de l'état
export const useAppLoading = () => useApp((state) => ({ 
  loading: state.loading, 
  loadingMessage: state.loadingMessage 
}));

export const useAppNotifications = () => useApp((state) => ({
  notifications: state.notifications,
  addNotification: state.addNotification,
  removeNotification: state.removeNotification,
  clearNotifications: state.clearNotifications,
}));

export const useAppCache = () => useApp((state) => ({
  isCacheValid: state.isCacheValid,
  invalidateCache: state.invalidateCache,
  setCacheExpiry: state.setCacheExpiry,
}));

export const useAppSync = () => useApp((state) => ({
  syncInProgress: state.syncInProgress,
  lastSync: state.lastSync,
  isOnline: state.isOnline,
  startSync: state.startSync,
  endSync: state.endSync,
}));

export const useAppTabs = () => useApp((state) => ({
  tabId: state.tabId,
  isPrimaryTab: state.isPrimaryTab,
  otherTabs: state.otherTabs,
  notifyOtherTabs: state.notifyOtherTabs,
}));
