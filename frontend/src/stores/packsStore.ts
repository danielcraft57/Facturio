import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Pack, CreatePackData, UpdatePackData, PackFilters } from '../types/pack';
import { packService } from '../services/packService';

interface PacksState {
  // Données
  packs: Pack[];
  currentPack: Pack | null;
  
  // États de chargement
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  
  // Filtres et pagination
  filters: PackFilters;
  page: number;
  limit: number;
  total: number;
  
  // Actions
  fetchPacks: (filters?: PackFilters, page?: number, limit?: number) => Promise<void>;
  fetchPack: (id: string) => Promise<void>;
  createPack: (data: CreatePackData) => Promise<Pack | null>;
  updatePack: (id: string, data: UpdatePackData) => Promise<Pack | null>;
  deletePack: (id: string) => Promise<boolean>;
  setFilters: (filters: PackFilters) => void;
  setPage: (page: number) => void;
  clearCurrentPack: () => void;
  markAsStale: () => void;
}

export const usePacksStore = create<PacksState>()(
  persist(
    (set) => ({
      // État initial
      packs: [],
      currentPack: null,
      loading: false,
      creating: false,
      updating: false,
      deleting: false,
      filters: {},
      page: 1,
      limit: 10,
      total: 0,

      // Actions
      fetchPacks: async (filters, page = 1, limit = 10) => {
        set({ loading: true });
        try {
          const response = await packService.getPacks(filters, page, limit);
          set({
            packs: response.packs,
            total: response.total,
            page: response.page,
            limit: response.limit,
            loading: false
          });
        } catch (error) {
          console.error('Erreur lors du chargement des packs:', error);
          set({ loading: false });
        }
      },

      fetchPack: async (id: string) => {
        set({ loading: true });
        try {
          const pack = await packService.getPack(id);
          set({ currentPack: pack, loading: false });
        } catch (error) {
          console.error('Erreur lors du chargement du pack:', error);
          set({ loading: false });
        }
      },

      createPack: async (data: CreatePackData) => {
        set({ creating: true });
        try {
          const newPack = await packService.createPack(data);
          if (newPack) {
            set(state => ({
              packs: [newPack, ...state.packs],
              creating: false
            }));
          }
          return newPack;
        } catch (error) {
          console.error('Erreur lors de la création du pack:', error);
          set({ creating: false });
          return null;
        }
      },

      updatePack: async (id: string, data: UpdatePackData) => {
        set({ updating: true });
        try {
          const updatedPack = await packService.updatePack(id, data);
          if (updatedPack) {
            set(state => ({
              packs: state.packs.map(pack => 
                pack.id === id ? updatedPack : pack
              ),
              currentPack: state.currentPack?.id === id ? updatedPack : state.currentPack,
              updating: false
            }));
          }
          return updatedPack;
        } catch (error) {
          console.error('Erreur lors de la mise à jour du pack:', error);
          set({ updating: false });
          return null;
        }
      },

      deletePack: async (id: string) => {
        set({ deleting: true });
        try {
          const success = await packService.deletePack(id);
          if (success) {
            set(state => ({
              packs: state.packs.filter(pack => pack.id !== id),
              currentPack: state.currentPack?.id === id ? null : state.currentPack,
              deleting: false
            }));
          }
          return success;
        } catch (error) {
          console.error('Erreur lors de la suppression du pack:', error);
          set({ deleting: false });
          return false;
        }
      },

      setFilters: (filters: PackFilters) => {
        set({ filters, page: 1 });
      },

      setPage: (page: number) => {
        set({ page });
      },

      clearCurrentPack: () => {
        set({ currentPack: null });
      },

      markAsStale: () => {
        set({ packs: [] });
      }
    }),
    {
      name: 'packs-store',
      partialize: (state) => ({
        packs: state.packs,
        filters: state.filters,
        page: state.page,
        limit: state.limit,
        total: state.total
      })
    }
  )
);
