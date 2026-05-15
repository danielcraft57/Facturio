import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeSettings } from '../theme/theme';

// Types pour l'état du thème
export interface ThemeState {
  // Paramètres du thème
  settings: ThemeSettings;
  
  // Actions
  updateSettings: (settings: Partial<ThemeSettings>) => void;
  resetSettings: () => void;
  setPreset: (presetName: string) => void;
}

// Paramètres par défaut
const defaultSettings: ThemeSettings = {
  mode: 'light',
  primary: '#1e40af',
  secondary: '#047857',
  radius: 10,
  density: 'comfortable',
};

// Store du thème
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      // État initial
      settings: defaultSettings,

      // Actions
      updateSettings: (newSettings: Partial<ThemeSettings>) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      resetSettings: () => {
        set({ settings: defaultSettings });
      },

              setPreset: (presetId: string) => {
          // Import dynamique des presets pour éviter les dépendances circulaires
          import('../theme/theme').then(({ THEME_PRESETS }) => {
            const preset = THEME_PRESETS.find(p => p.id === presetId);
            if (preset) {
              set({ 
                settings: { 
                  ...defaultSettings, 
                  primary: preset.primary, 
                  secondary: preset.secondary, 
                  radius: preset.radius, 
                  density: preset.density 
                } 
              });
            }
          });
        },
    }),
    {
      name: 'facturio-theme-store',
      partialize: (state) => ({
        settings: state.settings,
      }),
    }
  )
);
