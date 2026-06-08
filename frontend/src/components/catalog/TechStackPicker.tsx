import { useEffect, useState } from 'react'
import {
  alpha,
  Box,
  Typography,
  Chip,
  FormHelperText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Stack,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { catalogService, type TechStackChoices } from '../../services/catalogService'
import {
  PICKER_CATEGORY_TO_ASSEMBLY,
  TechCategoryFieldIcon,
  TechStackIcon,
  resolveTechAccentColor,
} from '../../modules/products/constants/techVisual'
import { resolveOnboardingProfile } from '../../modules/onboarding/onboardingProfiles'
import type { TechAssemblyCategory } from '../../types/techStack'

type Props = {
  value: string[]
  onChange: (ids: string[]) => void
  profileId?: string | null
  error?: string | null
}

function pickerCategoryAssembly(categoryId: string): TechAssemblyCategory | undefined {
  return PICKER_CATEGORY_TO_ASSEMBLY[categoryId]
}

export function TechStackPicker({ value, onChange, profileId, error }: Props) {
  const [choices, setChoices] = useState<TechStackChoices | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    catalogService
      .getTechChoices()
      .then(setChoices)
      .catch(() => setLoadError('Impossible de charger les technologies'))
  }, [])

  const countInCategory = (categoryId: string) =>
    choices
      ? value.filter((id) =>
          choices.categories.find((c) => c.id === categoryId)?.options.some((o) => o.id === id),
        ).length
      : 0

  const toggle = (id: string, categoryId: string, maxSelect?: number) => {
    const selected = new Set(value)
    if (selected.has(id)) {
      selected.delete(id)
    } else {
      if (maxSelect && countInCategory(categoryId) >= maxSelect) return
      if (choices && selected.size >= choices.maxTotalSelect) return
      selected.add(id)
    }
    onChange([...selected])
  }

  if (loadError) {
    return <Alert severity="warning">{loadError}</Alert>
  }

  const profile = resolveOnboardingProfile(profileId)
  const visibleCategories =
    choices && profile
      ? choices.categories.filter((cat) => profile.techCategories.includes(cat.id))
      : (choices?.categories ?? [])

  if (!choices) {
    return <Typography variant="body2" color="text.secondary">Chargement des technologies…</Typography>
  }

  const profileHint = profile
    ? `Couches adaptées au profil « ${profile.label} ».`
    : choices.subtitle

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        {choices.title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {profileHint}
      </Typography>

      {visibleCategories.map((cat) => {
        const assemblyCat = pickerCategoryAssembly(cat.id)
        return (
          <Accordion
            key={cat.id}
            disableGutters
            elevation={0}
            sx={{ border: '1px solid', borderColor: 'divider', mb: 1, borderRadius: 1.5, '&:before': { display: 'none' } }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 48 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
                {assemblyCat ? <TechCategoryFieldIcon category={assemblyCat} size={16} /> : null}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {cat.label}
                    {cat.maxSelect ? (
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        ({countInCategory(cat.id)}/{cat.maxSelect})
                      </Typography>
                    ) : null}
                  </Typography>
                  {cat.hint ? (
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {cat.hint}
                    </Typography>
                  ) : null}
                </Box>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {cat.options.map((opt) => {
                  const selected = value.includes(opt.id)
                  const color = resolveTechAccentColor(opt.label, assemblyCat)
                  return (
                    <Chip
                      key={opt.id}
                      icon={<TechStackIcon label={opt.label} category={assemblyCat} size={13} />}
                      label={opt.label}
                      clickable
                      onClick={() => toggle(opt.id, cat.id, cat.maxSelect)}
                      sx={{
                        fontWeight: selected ? 700 : 500,
                        pl: 0.25,
                        color: selected ? color : 'text.secondary',
                        bgcolor: selected ? alpha(color, 0.14) : 'transparent',
                        border: '1px solid',
                        borderColor: selected ? alpha(color, 0.45) : 'divider',
                        '& .MuiChip-icon': { ml: 0.5, mr: -0.25 },
                      }}
                      variant={selected ? 'filled' : 'outlined'}
                    />
                  )
                })}
              </Box>
            </AccordionDetails>
          </Accordion>
        )
      })}

      <FormHelperText error={!!error} sx={{ mt: 1 }}>
        {error ??
          `${value.length} sélectionné(s) — minimum ${choices.minTotalSelect}, maximum ${choices.maxTotalSelect}`}
      </FormHelperText>
    </Box>
  )
}
