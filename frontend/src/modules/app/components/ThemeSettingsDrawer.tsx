import { useMemo } from 'react'
import { Box, Divider, Drawer, FormControl, InputLabel, MenuItem, Select, Slider, Stack, Typography, Button } from '@mui/material'
import { THEME_PRESETS } from '../../../theme/theme'
import type { ThemeDensity, ThemeSettings } from '../../../theme/theme'

type ThemeSettingsDrawerProps = {
  open: boolean
  onClose: () => void
  settings: ThemeSettings
  onChange: (next: ThemeSettings) => void
}

export function ThemeSettingsDrawer({ open, onClose, settings, onChange }: ThemeSettingsDrawerProps) {
  const presets = useMemo(() => THEME_PRESETS, [])

  const handlePreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId)
    if (!preset) return
    onChange({ ...settings, primary: preset.primary, secondary: preset.secondary, radius: preset.radius, density: preset.density })
  }

  return (
    <Drawer anchor="right" open={open} onClose={onClose} sx={{ [`& .MuiDrawer-paper`]: { width: 360 } }}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Thème</Typography>
        <Stack spacing={2}>
          <FormControl fullWidth>
            <InputLabel id="preset-label">Preset</InputLabel>
            <Select labelId="preset-label" label="Preset" value={''} onChange={(e) => handlePreset(String(e.target.value))} displayEmpty renderValue={() => 'Choisir un preset'}>
              {presets.map(p => (
                <MenuItem key={p.id} value={p.id}>{p.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Divider />

          <FormControl fullWidth>
            <InputLabel id="density-label">Densité</InputLabel>
            <Select
              labelId="density-label"
              label="Densité"
              value={settings.density}
              onChange={(e) => onChange({ ...settings, density: e.target.value as ThemeDensity })}
            >
              <MenuItem value="comfortable">Confort</MenuItem>
              <MenuItem value="compact">Compact</MenuItem>
            </Select>
          </FormControl>

          <Box>
            <Typography gutterBottom>Arrondi ({settings.radius}px)</Typography>
            <Slider min={0} max={24} step={1} value={settings.radius} onChange={(_, v) => onChange({ ...settings, radius: v as number })} />
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 28, height: 28, bgcolor: settings.primary, borderRadius: 1, border: '1px solid rgba(0,0,0,0.12)' }} />
            <Typography sx={{ minWidth: 90 }}>Primaire</Typography>
            <input type="color" value={settings.primary} onChange={(e) => onChange({ ...settings, primary: e.target.value })} style={{ width: 44, height: 28, border: 'none', background: 'transparent', padding: 0 }} />
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 28, height: 28, bgcolor: settings.secondary, borderRadius: 1, border: '1px solid rgba(0,0,0,0.12)' }} />
            <Typography sx={{ minWidth: 90 }}>Secondaire</Typography>
            <input type="color" value={settings.secondary} onChange={(e) => onChange({ ...settings, secondary: e.target.value })} style={{ width: 44, height: 28, border: 'none', background: 'transparent', padding: 0 }} />
          </Stack>

          <Button variant="outlined" onClick={() => onChange({ ...settings, primary: '#1976d2', secondary: '#9c27b0', radius: 10, density: 'comfortable' })}>Réinitialiser</Button>
        </Stack>
      </Box>
    </Drawer>
  )
}


