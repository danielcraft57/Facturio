import { useMemo } from 'react'
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
import CodeOutlinedIcon from '@mui/icons-material/CodeOutlined'
import {
  PRODUCT_TECH_POPULAR,
  PRODUCT_TECH_SUGGESTIONS,
  filterTechSuggestions,
  findTechOption,
  normalizeTechLabel,
  techGroupColor,
  techTierColor,
  type ProductTechOption,
} from '../constants/productTechSuggestions'

type TechAutocompleteValue = ProductTechOption | string

type Props = {
  value: string[]
  onChange: (value: string[]) => void
}

function mergeUnique(values: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of values) {
    const label = normalizeTechLabel(raw)
    if (!label) continue
    const key = label.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(label)
  }
  return out
}

export function ProductTechAutocomplete({ value, onChange }: Props) {
  const selectedOptions = useMemo(
    () =>
      value.map(
        (v) =>
          findTechOption(v) ?? {
            label: v,
            group: 'Outils & build' as const,
            tier: 'Spécialisé & niche' as const,
            rank: 999,
          },
      ),
    [value],
  )

  const addPopular = (label: string) => {
    onChange(mergeUnique([...value, label]))
  }

  return (
    <Box>
      <Autocomplete<TechAutocompleteValue, true, false, true>
        multiple
        freeSolo
        disableCloseOnSelect
        options={PRODUCT_TECH_SUGGESTIONS}
        value={selectedOptions}
        groupBy={(opt) => (typeof opt === 'string' ? 'Personnalisé' : opt.tier)}
        getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt.label)}
        isOptionEqualToValue={(a, b) =>
          (typeof a === 'string' ? a : a.label).toLowerCase() ===
          (typeof b === 'string' ? b : b.label).toLowerCase()
        }
        filterOptions={(_options, state) => {
          const q = state.inputValue.trim()
          const ranked = filterTechSuggestions(q, 56)
          const custom: string[] =
            q && !ranked.some((o) => o.label.toLowerCase() === q.toLowerCase()) ? [q] : []
          return [...ranked, ...custom]
        }}
        onChange={(_e, next) => {
          const labels = next.map((item) =>
            typeof item === 'string' ? normalizeTechLabel(item) : item.label,
          )
          onChange(mergeUnique(labels))
        }}
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((option, index) => {
            const label = typeof option === 'string' ? option : option.label
            const group = typeof option === 'string' ? undefined : option.group
            const color = group ? techGroupColor(group) : '#64748b'
            const { key, ...chipProps } = getTagProps({ index })
            return (
              <Chip
                key={key}
                {...chipProps}
                label={label}
                size="small"
                sx={{
                  fontWeight: 600,
                  bgcolor: alpha(color, 0.12),
                  color,
                  border: '1px solid',
                  borderColor: alpha(color, 0.28),
                  '& .MuiChip-deleteIcon': {
                    color: alpha(color, 0.75),
                    '&:hover': { color },
                  },
                }}
              />
            )
          })
        }
        renderOption={(props, option) => {
          const { key, ...rest } = props as typeof props & { key: string }
          const label = typeof option === 'string' ? option : option.label
          const group = typeof option === 'string' ? undefined : option.group
          const tier = typeof option === 'string' ? 'Personnalisé' : option.tier
          const tierColor = techTierColor(tier)
          const groupColor = group ? techGroupColor(group) : '#64748b'
          const isCustom = typeof option === 'string'
          return (
            <Box
              component="li"
              key={key}
              {...rest}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1.5,
                py: 1,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600} noWrap>
                  {label}
                </Typography>
                {isCustom ? (
                  <Typography variant="caption" color="text.secondary">
                    Entrée pour ajouter
                  </Typography>
                ) : group ? (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {group}
                  </Typography>
                ) : null}
              </Box>
              {!isCustom && (
                <Chip
                  label={tier}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    bgcolor: alpha(tierColor, 0.12),
                    color: tierColor,
                    flexShrink: 0,
                    maxWidth: 140,
                    '& .MuiChip-label': { px: 0.75 },
                  }}
                />
              )}
              {!isCustom && group && (
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: groupColor,
                    flexShrink: 0,
                  }}
                  title={group}
                />
              )}
            </Box>
          )
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Technologies & langages"
            placeholder="Tapez HTML, Rust, Kubernetes, Assembly…"
            helperText="Recherche intelligente — Entrée pour ajouter une techno personnalisée"
            slotProps={{
              input: {
                ...params.InputProps,
                startAdornment: (
                  <>
                    <InputAdornment position="start" sx={{ ml: 0.5, mr: -0.5 }}>
                      <CodeOutlinedIcon fontSize="small" color="primary" />
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
              mt: 0.75,
              borderRadius: 2.5,
              boxShadow: (t) => t.shadows[8],
              '& .MuiAutocomplete-groupLabel': {
                fontWeight: 700,
                fontSize: '0.68rem',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: 'text.secondary',
                bgcolor: 'action.hover',
                lineHeight: 2.2,
              },
            },
          },
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2.5,
            alignItems: 'flex-start',
            py: 0.75,
          },
        }}
      />

      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Tendances 2026–2028
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={0.75}>
          {PRODUCT_TECH_POPULAR.map((label) => {
            const selected = value.some((v) => v.toLowerCase() === label.toLowerCase())
            const opt = findTechOption(label)
            const color = opt ? techGroupColor(opt.group) : '#2563eb'
            return (
              <Chip
                key={label}
                label={label}
                size="small"
                clickable
                variant={selected ? 'filled' : 'outlined'}
                onClick={() => !selected && addPopular(label)}
                sx={{
                  fontWeight: 600,
                  ...(selected
                    ? {
                        bgcolor: alpha(color, 0.16),
                        color,
                        borderColor: alpha(color, 0.35),
                      }
                    : {
                        borderColor: alpha(color, 0.25),
                        '&:hover': { bgcolor: alpha(color, 0.08) },
                      }),
                }}
              />
            )
          })}
        </Stack>
      </Box>
    </Box>
  )
}
