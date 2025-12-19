import { create } from 'zustand';

// Types pour la synchronisation
export interface SyncEvent {
  type: string;
  data?: any;
  timestamp: number;
  source: string;
}

export interface SyncState {
  // État de synchronisation
  isOnline: boolean;
  lastSync: number;
  syncInProgress: boolean;
  
  // Gestion des événements
  pendingEvents: SyncEvent[];
  processedEvents: Set<string>;
  
  // Actions
  setOnline: (online: boolean) => void;
  addEvent: (event: Omit<SyncEvent, 'timestamp' | 'source'>) => void;
  processEvent: (event: SyncEvent) => void;
  clearEvents: () => void;
  
  // Synchronisation
  startSync: () => void;
  endSync: () => void;
  sync: () => Promise<void>;
}

export const useSyncManager = create<SyncState>((set, get) => ({
  // État initial
  isOnline: navigator.onLine,
  lastSync: Date.now(),
  syncInProgress: false,
  pendingEvents: [],
  processedEvents: new Set(),

  // Actions
  setOnline: (online) => {
    set({ isOnline: online });
    if (online) {
      // Tentative de synchronisation automatique
      get().sync();
    }
  },

  addEvent: (event) => {
    const syncEvent: SyncEvent = {
      ...event,
      timestamp: Date.now(),
      source: `tab_${Date.now()}`,
    };

    set((state) => ({
      pendingEvents: [...state.pendingEvents, syncEvent],
    }));

    // Traitement immédiat si en ligne
    if (get().isOnline) {
      get().processEvent(syncEvent);
    }
  },

  processEvent: (event) => {
    const { processedEvents } = get();
    const eventId = `${event.type}_${event.timestamp}_${event.source}`;
    
    if (processedEvents.has(eventId)) {
      return; // Événement déjà traité
    }

    // Marquer comme traité
    set((state) => ({
      processedEvents: new Set([...state.processedEvents, eventId]),
    }));

    // Traiter l'événement selon son type
    switch (event.type) {
      case 'cache_invalidated':
        // Invalider le cache local
        console.log('Cache invalidé:', event.data);
        break;
        
      case 'data_updated':
        // Forcer le rechargement des données
        console.log('Données mises à jour:', event.data);
        break;
        
      case 'user_action':
        // Réagir aux actions utilisateur
        console.log('Action utilisateur:', event.data);
        break;
    }
  },

  clearEvents: () => {
    set({
      pendingEvents: [],
      processedEvents: new Set(),
    });
  },

  // Synchronisation
  startSync: () => {
    set({ syncInProgress: true });
  },

  endSync: () => {
    set({ syncInProgress: false });
  },

  sync: async () => {
    const { pendingEvents, isOnline } = get();
    
    if (!isOnline || pendingEvents.length === 0) {
      return;
    }

    get().startSync();

    try {
      // Traiter tous les événements en attente
      for (const event of pendingEvents) {
        get().processEvent(event);
      }

      // Vider la liste des événements traités
      get().clearEvents();
      
      set({ lastSync: Date.now() });
    } catch (error) {
      console.error('Erreur de synchronisation:', error);
    } finally {
      get().endSync();
    }
  },
}));

// Hook pour utiliser la synchronisation
export const useSync = () => {
  return useSyncManager();
};
