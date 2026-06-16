import { type ReactNode } from 'react'
import { Box, Typography, alpha, useTheme } from '@mui/material'
import type { NavItem } from '../config/navConfig'
import { SETTINGS_SECTION_LABELS } from '../../account/settingsNav'
import { ProPlanBadge } from '../../../components/billing/ProPlanBadge'

type SettingsMegaMenuColumnsProps = {
  compte: NavItem[]
  facturation: NavItem[]
  donnees: NavItem[]
  api: NavItem[]
  renderItem: (item: NavItem, staggerIndex: number) => ReactNode
}

type SettingsColumnDef = {
  id: 'compte' | 'facturation' | 'donnees' | 'api'
  label: string
  items: NavItem[]
  proSection?: boolean
}

/**
 * En-tête de colonne pour le mega-menu Paramètres.
 */
function SettingsColumnHeader({ label, proSection = false }: { label: string; proSection?: boolean }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        mb: 0.75,
        px: 0.25,
        minHeight: 22,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          fontSize: '0.68rem',
          color: proSection ? '#b45309' : 'text.secondary',
        }}
      >
        {label}
      </Typography>
      {proSection && <ProPlanBadge />}
    </Box>
  )
}

/**
 * Grille du mega-menu Paramètres : une colonne verticale par section (Compte, Facturation, etc.).
 */
export function SettingsMegaMenuColumns({
  compte,
  facturation,
  donnees,
  api,
  renderItem,
}: SettingsMegaMenuColumnsProps) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const columns: SettingsColumnDef[] = [
    { id: 'compte', label: SETTINGS_SECTION_LABELS.compte, items: compte },
    { id: 'facturation', label: SETTINGS_SECTION_LABELS.facturation, items: facturation },
    { id: 'donnees', label: SETTINGS_SECTION_LABELS.donnees, items: donnees },
    { id: 'api', label: SETTINGS_SECTION_LABELS.api, items: api, proSection: true },
  ].filter((col) => col.items.length > 0)

  const columnCount = columns.length

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, minmax(0, 1fr))',
          md: columnCount >= 4 ? 'repeat(4, minmax(0, 1fr))' : `repeat(${columnCount}, minmax(0, 1fr))`,
        },
        gap: 1.25,
        alignItems: 'start',
      }}
    >
      {columns.map((column) => (
        <Box
          key={column.id}
          sx={{
            borderRadius: 2,
            p: 1,
            minWidth: 0,
            bgcolor: column.proSection
              ? alpha('#b45309', isDark ? 0.08 : 0.04)
              : isDark
                ? alpha('#fff', 0.03)
                : alpha('#0f172a', 0.02),
            border: '1px solid',
            borderColor: column.proSection
              ? alpha('#b45309', isDark ? 0.22 : 0.14)
              : isDark
                ? alpha('#fff', 0.06)
                : alpha('#0f172a', 0.06),
          }}
        >
          <SettingsColumnHeader label={column.label} proSection={column.proSection} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.35 }}>
            {column.items.map((item, index) => renderItem(item, index))}
          </Box>
        </Box>
      ))}
    </Box>
  )
}
