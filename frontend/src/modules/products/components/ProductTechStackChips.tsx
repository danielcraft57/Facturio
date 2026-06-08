import { Chip, Stack, Tooltip, Typography } from '@mui/material'
import type { TechStackAssembly } from '../../../types/techStack'
import {
  TECH_ASSEMBLY_CATEGORY_LABELS,
  TECH_ASSEMBLY_CATEGORY_ORDER,
} from '../../../types/techStack'

type Props = {
  techStack?: TechStackAssembly | null
  languages?: string[]
  maxPerCategory?: number
  compact?: boolean
}

export function ProductTechStackChips({
  techStack,
  languages,
  maxPerCategory = 3,
  compact = false,
}: Props) {
  const hasAssembly = TECH_ASSEMBLY_CATEGORY_ORDER.some(
    (cat) => (techStack?.[cat]?.length ?? 0) > 0,
  )

  if (!hasAssembly) {
    const flat = languages ?? []
    if (flat.length === 0) return null
    return (
      <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: compact ? 0.5 : 1 }}>
        {flat.slice(0, compact ? 4 : 6).map((lang) => (
          <Chip key={lang} label={lang} size="small" variant="outlined" sx={{ height: 22 }} />
        ))}
      </Stack>
    )
  }

  return (
    <Stack gap={0.75} sx={{ mt: compact ? 0.5 : 1 }}>
      {TECH_ASSEMBLY_CATEGORY_ORDER.map((cat) => {
        const items = techStack?.[cat] ?? []
        if (items.length === 0) return null
        const shown = items.slice(0, maxPerCategory)
        const extra = items.length - shown.length
        return (
          <Stack key={cat} direction="row" flexWrap="wrap" alignItems="center" gap={0.5}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ minWidth: compact ? 52 : 64, fontWeight: 600 }}
            >
              {TECH_ASSEMBLY_CATEGORY_LABELS[cat]}
            </Typography>
            {shown.map((label) => (
              <Chip
                key={`${cat}-${label}`}
                label={label}
                size="small"
                variant="outlined"
                sx={{ height: 22 }}
              />
            ))}
            {extra > 0 && (
              <Tooltip title={items.join(', ')}>
                <Chip label={`+${extra}`} size="small" sx={{ height: 22 }} />
              </Tooltip>
            )}
          </Stack>
        )
      })}
    </Stack>
  )
}
