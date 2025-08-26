import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

// Types pour la gestion du cache
export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  version: string;
  etag?: string;
  expiresAt?: number;
}

export interface CacheState {
  // Cache par store
  cache: Record<string, CacheEntry>;
  
  // Métadonnées du cache
  cacheVersion: string;
  lastCleanup: number;
  totalSize: number;
  
  // Configuration
  maxSize: number; // Taille maximale en bytes
  maxAge: number; // Âge maximal en ms
  cleanupInterval: number; // Intervalle de nettoyage
  
  // Actions
  set: <T>(key: string, data: T, options?: CacheOptions) => void;
  get: <T>(key: string) => T | null;
  has: (key: string) => boolean;
  delete: (key: string) => void;
  clear: () => void;
  
  // Gestion avancée
  invalidate: (pattern?: string) => void;
  cleanup: () => void;
  getStats: () => CacheStats;
  
  // Synchronisation
  sync: () => void;
  isStale: (key: string) => boolean;
}

export interface CacheOptions {
  ttl?: number; // Time to live en ms
  version?: string; // Version des données
  etag?: string; // ETag pour la validation
  priority?: 'high' | 'normal' | 'low';
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  oldestEntry: number;
  newestEntry: number;
  expiredEntries: number;
}

// Configuration
const CACHE_CONFIG = {
  VERSION: '1.0.0',
  MAX_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_AGE: 24 * 60 * 60 * 1000, // 24h
  CLEANUP_INTERVAL: 60 * 60 * 1000, // 1h
  HIGH_PRIORITY_TTL: 5 * 60 * 1000, // 5min
  NORMAL_PRIORITY_TTL: 30 * 60 * 1000, // 30min
  LOW_PRIORITY_TTL: 2 * 60 * 60 * 1000, // 2h
};

export const useCacheManager = create<CacheState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // État initial
        cache: {},
        cacheVersion: CACHE_CONFIG.VERSION,
        lastCleanup: Date.now(),
        totalSize: 0,
        maxSize: CACHE_CONFIG.MAX_SIZE,
        maxAge: CACHE_CONFIG.MAX_AGE,
        cleanupInterval: CACHE_CONFIG.CLEANUP_INTERVAL,

        // Actions de base
        set: <T>(key: string, data: T, options: CacheOptions = {}) => {
          const { ttl, version, etag, priority = 'normal' } = options;
          
          // Calculer la TTL selon la priorité
          let finalTtl = ttl;
          if (!finalTtl) {
            switch (priority) {
              case 'high':
                finalTtl = CACHE_CONFIG.HIGH_PRIORITY_TTL;
                break;
              case 'normal':
                finalTtl = CACHE_CONFIG.NORMAL_PRIORITY_TTL;
                break;
              case 'low':
                finalTtl = CACHE_CONFIG.LOW_PRIORITY_TTL;
                break;
            }
          }

          const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            version: version || CACHE_CONFIG.VERSION,
            etag,
            expiresAt: finalTtl ? Date.now() + finalTtl : undefined,
          };

          // Vérifier la taille avant d'ajouter
          const entrySize = JSON.stringify(entry).length;
          const { totalSize, maxSize } = get();
          
          if (totalSize + entrySize > maxSize) {
            // Nettoyer le cache si nécessaire
            get().cleanup();
          }

          set((state) => ({
            cache: {
              ...state.cache,
              [key]: entry,
            },
            totalSize: state.totalSize + entrySize,
          }));
        },

        get: <T>(key: string): T | null => {
          const { cache } = get();
          const entry = cache[key] as CacheEntry<T>;
          
          if (!entry) return null;
          
          // Vérifier l'expiration
          if (entry.expiresAt && Date.now() > entry.expiresAt) {
            get().delete(key);
            return null;
          }
          
          // Vérifier la version
          if (entry.version !== CACHE_CONFIG.VERSION) {
            get().delete(key);
            return null;
          }
          
          return entry.data;
        },

        has: (key: string): boolean => {
          const { cache } = get();
          const entry = cache[key];
          
          if (!entry) return false;
          
          // Vérifier l'expiration
          if (entry.expiresAt && Date.now() > entry.expiresAt) {
            get().delete(key);
            return false;
          }
          
          return true;
        },

        delete: (key: string) => {
          set((state) => {
            const entry = state.cache[key];
            if (!entry) return state;
            
            const entrySize = JSON.stringify(entry).length;
            const newCache = { ...state.cache };
            delete newCache[key];
            
            return {
              cache: newCache,
              totalSize: Math.max(0, state.totalSize - entrySize),
            };
          });
        },

        clear: () => {
          set({
            cache: {},
            totalSize: 0,
          });
        },

        // Gestion avancée
        invalidate: (pattern?: string) => {
          set((state) => {
            const newCache = { ...state.cache };
            let removedSize = 0;
            
            Object.keys(newCache).forEach((key) => {
              if (!pattern || key.includes(pattern)) {
                const entry = newCache[key];
                removedSize += JSON.stringify(entry).length;
                delete newCache[key];
              }
            });
            
            return {
              cache: newCache,
              totalSize: Math.max(0, state.totalSize - removedSize),
            };
          });
        },

        cleanup: () => {
          const now = Date.now();
          const { maxAge } = get();
          
          set((state) => {
            const newCache = { ...state.cache };
            let removedSize = 0;
            let removedCount = 0;
            
            // Supprimer les entrées expirées
            Object.entries(newCache).forEach(([key, entry]) => {
              const isExpired = entry.expiresAt && now > entry.expiresAt;
              const isTooOld = now - entry.timestamp > maxAge;
              const isWrongVersion = entry.version !== CACHE_CONFIG.VERSION;
              
              if (isExpired || isTooOld || isWrongVersion) {
                removedSize += JSON.stringify(entry).length;
                delete newCache[key];
                removedCount++;
              }
            });
            
            // Si le cache est encore trop gros, supprimer les plus anciennes entrées
            if (state.totalSize - removedSize > state.maxSize) {
              const entries = Object.entries(newCache)
                .sort(([, a], [, b]) => a.timestamp - b.timestamp);
              
              for (const [key, entry] of entries) {
                if (state.totalSize - removedSize <= state.maxSize) break;
                
                removedSize += JSON.stringify(entry).length;
                delete newCache[key];
                removedCount++;
              }
            }
            
            return {
              cache: newCache,
              totalSize: Math.max(0, state.totalSize - removedSize),
              lastCleanup: now,
            };
          });
        },

        getStats: (): CacheStats => {
          const { cache, totalSize } = get();
          const entries = Object.values(cache);
          const now = Date.now();
          
          return {
            totalEntries: entries.length,
            totalSize,
            oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : 0,
            newestEntry: entries.length > 0 ? Math.max(...entries.map(e => e.timestamp)) : 0,
            expiredEntries: entries.filter(e => e.expiresAt && now > e.expiresAt).length,
          };
        },

        // Synchronisation
        sync: () => {
          // Nettoyer le cache
          get().cleanup();
          
          // Notifier les autres onglets
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('cache-sync', {
              detail: { timestamp: Date.now() }
            }));
          }
        },

        isStale: (key: string): boolean => {
          const { cache } = get();
          const entry = cache[key];
          
          if (!entry) return true;
          
          // Vérifier l'expiration
          if (entry.expiresAt && Date.now() > entry.expiresAt) {
            return true;
          }
          
          // Vérifier la version
          if (entry.version !== CACHE_CONFIG.VERSION) {
            return true;
          }
          
          return false;
        },
      }),
      {
        name: 'cache-manager',
        partialize: (state) => ({
          cache: state.cache,
          cacheVersion: state.cacheVersion,
          lastCleanup: state.lastCleanup,
          totalSize: state.totalSize,
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            // Nettoyer le cache au démarrage
            state.cleanup();
            
            // Nettoyage périodique
            setInterval(() => {
              state.cleanup();
            }, state.cleanupInterval);
            
            // Écouter les événements de synchronisation
            if (typeof window !== 'undefined') {
              window.addEventListener('cache-sync', () => {
                state.cleanup();
              });
            }
          }
        },
      }
    )
  )
);

// Hooks spécialisés
export const useCache = <T>(key: string) => {
  const cache = useCacheManager();
  return {
    data: cache.get<T>(key),
    set: (data: T, options?: CacheOptions) => cache.set(key, data, options),
    has: () => cache.has(key),
    delete: () => cache.delete(key),
    isStale: () => cache.isStale(key),
  };
};

export const useCacheStats = () => {
  return useCacheManager((state) => state.getStats());
};

// Utilitaires pour les stores
export const createCachedStore = <T extends Record<string, any>>(
  storeName: string,
  initialState: T
) => {
  const cache = useCacheManager.getState();
  
  return {
    ...initialState,
    
    // Méthodes de cache intégrées
    getCached: <R>(key: string): R | null => {
      return cache.get<R>(`${storeName}:${key}`);
    },
    
    setCached: <R>(key: string, data: R, options?: CacheOptions) => {
      cache.set(`${storeName}:${key}`, data, options);
    },
    
    invalidateCache: (pattern?: string) => {
      cache.invalidate(`${storeName}:${pattern || ''}`);
    },
    
    isCacheValid: (key: string): boolean => {
      return !cache.isStale(`${storeName}:${key}`);
    },
  };
};
