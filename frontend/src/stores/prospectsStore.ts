import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { prospectService } from '../services/prospectService';
import { Prospect, CreateProspectDto, UpdateProspectDto, ProspectFilters, ProspectStatus, Priority } from '../types/prospect';

interface ProspectsState {
  // Données
  prospects: Prospect[];
  total: number;
  loading: boolean;
  error: string | null;
  
  // Filtres et pagination
  filters: ProspectFilters;
  page: number;
  limit: number;
  
  // Cache
  cache: Map<string, { data: Prospect; timestamp: number }>;
  cacheExpiry: number; // 5 minutes
  
  // Actions
  setFilters: (filters: Partial<ProspectFilters>) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  
  // CRUD
  fetchProspects: (force?: boolean) => Promise<void>;
  createProspect: (data: CreateProspectDto) => Promise<Prospect>;
  updateProspect: (id: string, data: UpdateProspectDto) => Promise<Prospect>;
  deleteProspect: (id: string) => Promise<void>;
  
  // Cache management
  getCachedProspect: (id: string) => Prospect | null;
  setCachedProspect: (prospect: Prospect) => void;
  clearCache: () => void;
  
  // Utilitaires
  getProspectById: (id: string) => Prospect | undefined;
  getProspectsByStatus: (status: string) => Prospect[];
  getProspectsByIndustry: (industry: string) => Prospect[];
  getProspectsByPriority: (priority: string) => Prospect[];
}

const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export const useProspectsStore = create<ProspectsState>()(
  devtools(
    persist(
      (set, get) => ({
        // État initial
        prospects: [],
        total: 0,
        loading: false,
        error: null,
        filters: {},
        page: 1,
        limit: 20,
        cache: new Map(),
        cacheExpiry: CACHE_EXPIRY,
        
        // Setters
        setFilters: (filters) => {
          set({ filters: { ...get().filters, ...filters }, page: 1 });
        },
        
        setPage: (page) => set({ page }),
        
        setLimit: (limit) => set({ limit, page: 1 }),
        
        // CRUD Operations
        fetchProspects: async (force = false) => {
          const state = get();
          
          // Vérifier le cache si pas de force refresh
          if (!force && state.prospects.length > 0) {
            return;
          }
          
          set({ loading: true, error: null });
          
          try {
            const result = await prospectService.getProspects(
              state.filters,
              state.page,
              state.limit
            );
            
            set({
              prospects: result.data,
              total: result.total,
              loading: false
            });
            
            // Mettre en cache chaque prospect
            result.data.forEach(prospect => {
              get().setCachedProspect(prospect);
            });
            
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Erreur lors du chargement des prospects',
              loading: false
            });
          }
        },
        
        createProspect: async (data) => {
          set({ loading: true, error: null });
          
          try {
            const newProspect = await prospectService.createProspect(data);
            
            set(state => ({
              prospects: [newProspect, ...state.prospects],
              total: state.total + 1,
              loading: false
            }));
            
            // Mettre en cache
            get().setCachedProspect(newProspect);
            
            return newProspect;
            
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Erreur lors de la création du prospect',
              loading: false
            });
            throw error;
          }
        },
        
        updateProspect: async (id, data) => {
          set({ loading: true, error: null });
          
          try {
            const updatedProspect = await prospectService.updateProspect(id, data);
            
            set(state => ({
              prospects: state.prospects.map(p => 
                p.id === id ? updatedProspect : p
              ),
              loading: false
            }));
            
            // Mettre à jour le cache
            get().setCachedProspect(updatedProspect);
            
            return updatedProspect;
            
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour du prospect',
              loading: false
            });
            throw error;
          }
        },
        
        deleteProspect: async (id) => {
          set({ loading: true, error: null });
          
          try {
            await prospectService.deleteProspect(id);
            
            set(state => ({
              prospects: state.prospects.filter(p => p.id !== id),
              total: Math.max(0, state.total - 1),
              loading: false
            }));
            
            // Supprimer du cache
            get().cache.delete(id);
            
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Erreur lors de la suppression du prospect',
              loading: false
            });
            throw error;
          }
        },
        
        // Cache Management
        getCachedProspect: (id) => {
          const state = get();
          const cached = state.cache.get(id);
          
          if (!cached) return null;
          
          // Vérifier l'expiration
          if (Date.now() - cached.timestamp > state.cacheExpiry) {
            state.cache.delete(id);
            return null;
          }
          
          return cached.data;
        },
        
        setCachedProspect: (prospect) => {
          const state = get();
          state.cache.set(prospect.id, {
            data: prospect,
            timestamp: Date.now()
          });
        },
        
        clearCache: () => {
          set({ cache: new Map() });
        },
        
        // Utilitaires
        getProspectById: (id) => {
          const state = get();
          return state.prospects.find(p => p.id === id);
        },
        
        getProspectsByStatus: (status) => {
          const state = get();
          return state.prospects.filter(p => p.status === status);
        },
        
        getProspectsByIndustry: (industry) => {
          const state = get();
          return state.prospects.filter(p => p.industry === industry);
        },
        
        getProspectsByPriority: (priority) => {
          const state = get();
          return state.prospects.filter(p => p.priority === priority);
        }
      }),
      {
        name: 'prospects-store',
        partialize: (state) => ({
          filters: state.filters,
          page: state.page,
          limit: state.limit
        })
      }
    ),
    {
      name: 'prospects-store'
    }
  )
);

// Hooks utilitaires
export const useProspects = () => {
  const store = useProspectsStore();
  
  return {
    ...store,
    // Actions combinées
    refreshProspects: () => store.fetchProspects(true),
    
    // Filtres rapides
    setStatusFilter: (status: ProspectStatus[]) => store.setFilters({ status }),
    setIndustryFilter: (industry: string[]) => store.setFilters({ industry }),
    setPriorityFilter: (priority: Priority[]) => store.setFilters({ priority }),
    
    // Pagination
    nextPage: () => store.setPage(store.page + 1),
    prevPage: () => store.setPage(Math.max(1, store.page - 1)),
    
    // Statistiques rapides
    getStats: () => ({
      total: store.total,
      byStatus: store.prospects.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byIndustry: store.prospects.reduce((acc, p) => {
        acc[p.industry] = (acc[p.industry] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byPriority: store.prospects.reduce((acc, p) => {
        acc[p.priority] = (acc[p.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    })
  };
};
