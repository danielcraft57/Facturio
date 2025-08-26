import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DashboardStats } from '../services/dashboard';
import { dashboardService } from '../services/dashboard';

// Types pour l'état du dashboard
export interface DashboardState {
  // Données
  stats: DashboardStats | null;
  
  // État de chargement
  isLoading: boolean;
  
  // Cache et synchronisation
  lastFetch: Date | null;
  isStale: boolean;
  
  // Actions
  fetchStats: (period?: string) => Promise<void>;
  fetchStatsRealtime: () => Promise<void>;
  fetchStatsByPeriod: (startDate: Date, endDate: Date) => Promise<void>;
  
  // Actions locales
  clearCache: () => void;
  markAsStale: () => void;
}

// Store du dashboard
export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      // État initial
      stats: null,
      isLoading: false,
      lastFetch: null,
      isStale: true,

      // Actions
      fetchStats: async () => {
        set({ isLoading: true });
        
        try {
          const response = await dashboardService.getStats();
          set({
            stats: response.data,
            lastFetch: new Date(),
            isStale: false,
          });
        } catch (error) {
          console.error('Erreur lors du chargement des statistiques:', error);
          // Garder les données en cache en cas d'erreur
        } finally {
          set({ isLoading: false });
        }
      },

      fetchStatsRealtime: async () => {
        try {
          const response = await dashboardService.getStatsRealtime();
          set({
            stats: response.data,
            lastFetch: new Date(),
            isStale: false,
          });
        } catch (error) {
          console.error('Erreur lors du chargement des statistiques temps réel:', error);
        }
      },

      fetchStatsByPeriod: async (startDate: Date, endDate: Date) => {
        set({ isLoading: true });
        
        try {
          const startDateStr = startDate.toISOString().split('T')[0];
          const endDateStr = endDate.toISOString().split('T')[0];
          const response = await dashboardService.getStatsByPeriod(startDateStr, endDateStr);
          set({
            stats: response.data,
            lastFetch: new Date(),
            isStale: false,
          });
        } catch (error) {
          console.error('Erreur lors du chargement des statistiques par période:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      // Actions locales
      clearCache: () => {
        set({
          stats: null,
          lastFetch: null,
          isStale: true,
        });
      },

      markAsStale: () => {
        set({ isStale: true });
      },
    }),
    {
      name: 'facturio-dashboard-store',
      partialize: (state) => ({
        lastFetch: state.lastFetch,
      }),
    }
  )
);
