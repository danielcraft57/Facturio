import { useEffect, useState } from 'react'
import {
  Autocomplete,
  Box,
  Chip,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  alpha,
} from '@mui/material'
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined'
import { catalogService } from '../../../services/catalogService'
import type { TechStackAssembly, TechAssemblyCategory } from '../../../types/techStack'
import {
  TECH_ASSEMBLY_CATEGORY_LABELS,
  TECH_ASSEMBLY_CATEGORY_ORDER,
  flattenTechStack,
} from '../../../types/techStack'
import {
  TECH_CATEGORY_VISUAL,
  TechCategoryFieldIcon,
  TechStackIcon,
  resolveTechAccentColor,
} from '../constants/techVisual'

type Props = {
  value: TechStackAssembly
  onChange: (value: TechStackAssembly) => void
}

const CHOICE_TO_ASSEMBLY: Record<string, TechAssemblyCategory> = {
  languages: 'languages',
  frontend: 'frontend',
  backend: 'backend',
  cms: 'cms',
  databases: 'databases',
  devops: 'devops',
  ai: 'ai',
  mobile: 'mobile',
  cybersecurity: 'security',
}

function normalizeLabels(labels: string[]): string[] {
  const out: string[] = []
  for (const label of labels) {
    const trimmed = label.trim()
    if (!trimmed) continue
    const norm = trimmed.toLowerCase()
    if (!out.some((x) => x.toLowerCase() === norm)) out.push(trimmed)
  }
  return out
}

function renderTechChip(
  label: string,
  category: TechAssemblyCategory,
  getTagProps: (args: { index: number }) => { key: number; [key: string]: unknown },
  index: number,
) {
  const color = resolveTechAccentColor(label, category)
  const { key, ...rest } = getTagProps({ index })
  return (
    <Chip
      key={key}
      {...rest}
      icon={<TechStackIcon label={label} category={category} size={13} />}
      label={label}
      size="small"
      sx={{
        fontWeight: 600,
        fontSize: '0.75rem',
        pl: 0.25,
        bgcolor: alpha(color, 0.1),
        color,
        border: '1px solid',
        borderColor: alpha(color, 0.24),
        '& .MuiChip-icon': { ml: 0.5, mr: -0.25 },
        '& .MuiChip-deleteIcon': {
          color: alpha(color, 0.7),
          '&:hover': { color },
        },
      }}
    />
  )
}

export function ProductTechStackAssemblyField({ value, onChange }: Props) {
  const [loading, setLoading] = useState(true)
  const [optionsByCategory, setOptionsByCategory] = useState<
    Partial<Record<TechAssemblyCategory, string[]>>
  >({})

  useEffect(() => {
    let cancelled = false
    catalogService
      .getTechChoices()
      .then((choices) => {
        if (cancelled) return
        const map: Partial<Record<TechAssemblyCategory, string[]>> = {}
        for (const cat of choices.categories) {
          const assemblyCat = CHOICE_TO_ASSEMBLY[cat.id]
          if (!assemblyCat) continue
          const labels = cat.options.flatMap((o) => [o.label, ...o.matchTags])
          map[assemblyCat] = [...new Set(labels.map((l) => l.trim()).filter(Boolean))]
        }
        setOptionsByCategory(map)
      })
      .catch(() => {
        if (!cancelled) setOptionsByCategory({})
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const flatCount = flattenTechStack(value).length

  const setCategory = (cat: TechAssemblyCategory, labels: string[]) => {
    const next = { ...value }
    const normalized = normalizeLabels(labels)
    if (normalized.length === 0) delete next[cat]
    else next[cat] = normalized
    onChange(next)
  }

  if (loading) {
    return (
      <Typography variant="body2" color="text.secondary">
        Chargement des couches techno…
      </Typography>
    )
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <LayersOutlinedIcon fontSize="small" color="primary" />
        <Typography variant="subtitle2" fontWeight={600}>
          Assemblage techno
        </Typography>
        <Chip label={`${flatCount} techno(s)`} size="small" variant="outlined" />
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Par couche (langages, frontend, backend, IA…) — alimente les devis détaillés.
      </Typography>

      <Stack spacing={1.5}>
        {TECH_ASSEMBLY_CATEGORY_ORDER.map((cat) => {
          const options = optionsByCategory[cat] ?? []
          const selected = value[cat] ?? []
          const catColor = TECH_CATEGORY_VISUAL[cat].color
          return (
            <Autocomplete
              key={cat}
              multiple
              freeSolo
              size="small"
              options={options}
              value={selected}
              onChange={(_e, next) => {
                setCategory(
                  cat,
                  next.map((item) => (typeof item === 'string' ? item : item)),
                )
              }}
              renderTags={(tagValue, getTagProps) =>
                tagValue.map((label, index) => renderTechChip(label, cat, getTagProps, index))
              }
              renderOption={(props, option) => {
                const { key, ...rest } = props as typeof props & { key: string }
                const label = String(option)
                return (
                  <Box
                    component="li"
                    key={key}
                    {...rest}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.25,
                      py: 0.85,
                      px: 0.5,
                    }}
                  >
                    <TechStackIcon label={label} category={cat} size={17} />
                    <Typography variant="body2" fontWeight={500} noWrap sx={{ flex: 1 }}>
                      {label}
                    </Typography>
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: catColor,
                        flexShrink: 0,
                        opacity: 0.85,
                      }}
                    />
                  </Box>
                )
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={TECH_ASSEMBLY_CATEGORY_LABELS[cat]}
                  placeholder={options.length ? 'Rechercher ou ajouter…' : 'Ajouter…'}
                  slotProps={{
                    input: {
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start" sx={{ ml: 0.25, mr: -0.5 }}>
                            <TechCategoryFieldIcon category={cat} size={17} />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    },
                  }}
                />
              )}
              slotProps={{
                paper: {
                  sx: {
                    borderRadius: 2,
                    '& .MuiAutocomplete-option': { minHeight: 40 },
                  },
                },
              }}
            />
          )
        })}
      </Stack>
    </Box>
  )
}
