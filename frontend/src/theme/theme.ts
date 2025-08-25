import { createTheme } from '@mui/material/styles'

export type ThemeDensity = 'comfortable' | 'compact'

export type ThemeSettings = {
  mode: 'light' | 'dark'
  primary: string
  secondary: string
  radius: number
  density: ThemeDensity
}

export const THEME_PRESETS: Array<Pick<ThemeSettings, 'primary' | 'secondary' | 'radius' | 'density'> & { id: string; label: string }> = [
  { id: 'business', label: 'Business', primary: '#1976d2', secondary: '#9c27b0', radius: 10, density: 'comfortable' },
  { id: 'minimal', label: 'Minimal', primary: '#111827', secondary: '#6b7280', radius: 6, density: 'comfortable' },
  { id: 'energique', label: 'Énergique', primary: '#f43f5e', secondary: '#06b6d4', radius: 14, density: 'compact' },
]

export function createCustomTheme(settings: ThemeSettings) {
  const { mode, primary, secondary, radius, density } = settings
  return createTheme({
    palette: {
      mode,
      primary: {
        main: primary,
      },
      secondary: {
        main: secondary,
      },
      background: {
        default: mode === 'light' ? '#f5f5f5' : '#121212',
        paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
      },
    },
    shape: { borderRadius: radius },
    spacing: density === 'compact' ? 6 : 8,
    typography: {
      fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 700 },
    },
    components: {
      MuiButton: {
        defaultProps: { variant: 'contained', size: density === 'compact' ? 'small' : 'medium' },
      },
      MuiTextField: {
        defaultProps: { size: density === 'compact' ? 'small' : 'medium' },
      },
      MuiSelect: {
        defaultProps: { size: density === 'compact' ? 'small' : 'medium' },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'light' ? '#1976d2' : '#1e1e1e',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e',
          },
        },
      },
    },
  })
}


