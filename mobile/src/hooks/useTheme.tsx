import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { colors as lightColors } from '../theme'

const STORAGE_KEY = 'facturio:theme-mode'

const darkColors = {
  ...lightColors,
  background: '#020617',
  surface: '#0F172A',
  border: '#1E293B',
  text: '#E2E8F0',
  textMuted: '#94A3B8',
  infoBg: '#1E3A8A',
  successBg: '#064E3B',
  warningBg: '#78350F',
  errorBg: '#7F1D1D',
}

type ThemeMode = 'light' | 'dark'
type ColorTokens = Record<keyof typeof lightColors, string>

interface ThemeContextValue {
  mode: ThemeMode
  colors: ColorTokens
  isDark: boolean
  setMode: (mode: ThemeMode) => Promise<void>
  toggleMode: () => Promise<void>
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light')

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === 'dark' || v === 'light') setModeState(v)
      })
      .catch(() => {
        // no-op: fallback light
      })
  }, [])

  const setMode = async (nextMode: ThemeMode) => {
    setModeState(nextMode)
    await AsyncStorage.setItem(STORAGE_KEY, nextMode)
  }

  const toggleMode = async () => {
    const nextMode = mode === 'light' ? 'dark' : 'light'
    await setMode(nextMode)
  }

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      colors: (mode === 'dark' ? darkColors : lightColors) as ColorTokens,
      isDark: mode === 'dark',
      setMode,
      toggleMode,
    }),
    [mode],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return ctx
}
