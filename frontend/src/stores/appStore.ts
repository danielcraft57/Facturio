import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types pour l'état global
export interface AppState {
  // État de chargement global
  isLoading: boolean;
  loadingMessage: string;
  
  // Notifications et erreurs
  notifications: Notification[];
  errors: AppError[];
  
  // État de l'application
  isOnline: boolean;
  lastSync: Date | null;
  
  // Actions
  setLoading: (loading: boolean, message?: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  addError: (error: Omit<AppError, 'id' | 'timestamp'>) => void;
  clearErrors: () => void;
  setOnlineStatus: (online: boolean) => void;
  setLastSync: (date: Date) => void;
}

// Types pour les notifications
export interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  duration?: number;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
}

// Types pour les erreurs
export interface AppError {
  id: string;
  type: 'api' | 'validation' | 'network' | 'unknown';
  title: string;
  message: string;
  timestamp: Date;
  details?: any;
}

// Store principal de l'application
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // État initial
      isLoading: false,
      loadingMessage: '',
      notifications: [],
      errors: [],
      isOnline: navigator.onLine,
      lastSync: null,

      // Actions
      setLoading: (loading: boolean, message: string = '') => {
        set({ isLoading: loading, loadingMessage: message });
      },

      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        };
        
        set((state) => ({
          notifications: [...state.notifications, newNotification],
        }));

        // Auto-suppression si durée spécifiée
        if (notification.duration) {
          setTimeout(() => {
            get().removeNotification(newNotification.id);
          }, notification.duration);
        }
      },

      removeNotification: (id: string) => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id),
        }));
      },

      addError: (error) => {
        const newError: AppError = {
          ...error,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        };
        
        set((state) => ({
          errors: [...state.errors, newError],
        }));
      },

      clearErrors: () => {
        set({ errors: [] });
      },

      setOnlineStatus: (online: boolean) => {
        set({ isOnline: online });
      },

      setLastSync: (date: Date) => {
        set({ lastSync: date });
      },
    }),
    {
      name: 'facturio-app-store',
      partialize: (state) => ({
        isOnline: state.isOnline,
        lastSync: state.lastSync,
      }),
    }
  )
);

// Écouteurs d'événements globaux
if (typeof window !== 'undefined') {
  // Écouter les changements de connectivité
  window.addEventListener('online', () => {
    useAppStore.getState().setOnlineStatus(true);
  });
  
  window.addEventListener('offline', () => {
    useAppStore.getState().setOnlineStatus(false);
  });
}
