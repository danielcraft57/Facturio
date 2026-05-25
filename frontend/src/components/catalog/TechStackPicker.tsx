import { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Chip,
  FormHelperText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { catalogService, type TechStackChoices } from '../../services/catalogService'

type Props = {
  value: string[]
  onChange: (ids: string[]) => void
  error?: string | null
}

export function TechStackPicker({ value, onChange, error }: Props) {
  const [choices, setChoices] = useState<TechStackChoices | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    catalogService
      .getTechChoices()
      .then(setChoices)
      .catch(() => setLoadError('Impossible de charger les technologies'))
  }, [])

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

  const countInCategory = (categoryId: string) =>
    choices
      ? value.filter((id) =>
          choices.categories.find((c) => c.id === categoryId)?.options.some((o) => o.id === id),
        ).length
      : 0

  if (!choices) {
    return <Typography variant="body2" color="text.secondary">Chargement des technologies…</Typography>
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        {choices.title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {choices.subtitle}
      </Typography>

      {choices.categories.map((cat) => (
        <Accordion key={cat.id} disableGutters elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {cat.label}
                {cat.maxSelect ? (
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    ({countInCategory(cat.id)}/{cat.maxSelect})
                  </Typography>
                ) : null}
              </Typography>
              {cat.hint ? (
                <Typography variant="caption" color="text.secondary">
                  {cat.hint}
                </Typography>
              ) : null}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {cat.options.map((opt) => {
                const selected = value.includes(opt.id)
                return (
                  <Chip
                    key={opt.id}
                    label={opt.label}
                    clickable
                    color={selected ? 'primary' : 'default'}
                    variant={selected ? 'filled' : 'outlined'}
                    onClick={() => toggle(opt.id, cat.id, cat.maxSelect)}
                  />
                )
              })}
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}

      <FormHelperText error={!!error} sx={{ mt: 1 }}>
        {error ??
          `${value.length} sélectionné(s) — minimum ${choices.minTotalSelect}, maximum ${choices.maxTotalSelect}`}
      </FormHelperText>
    </Box>
  )
}
