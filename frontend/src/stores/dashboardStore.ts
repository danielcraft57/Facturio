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
    (set, get) => ({
      // État initial
      stats: null,
      isLoading: false,
      lastFetch: null,
      isStale: true,

      // Actions
      fetchStats: async () => {
        if (get().isLoading) return;
        set({ isLoading: true });

        try {
          const response = await dashboardService.getStats();
          const payload = (response as any).data?.data ?? (response as any).data;
          set({
            stats: payload ?? null,
            lastFetch: new Date(),
            isStale: false,
          });
        } catch (error) {
          console.error('Erreur lors du chargement des statistiques:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      fetchStatsRealtime: async () => {
        try {
          const response = await dashboardService.getStatsRealtime();
          const payload = (response as any).data?.data ?? (response as any).data;
          set({
            stats: payload ?? null,
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
          const payload = (response as any).data?.data ?? (response as any).data;
          set({
            stats: payload ?? null,
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
