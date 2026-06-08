import {
  alpha,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  Stack,
  Typography,
} from '@mui/material'
import type { OnboardingPreviewProduct } from '../../../services/onboardingService'

type Props = {
  products: OnboardingPreviewProduct[]
  selectedIds: number[]
  technologyLabels: string[]
  replayMode: boolean
  installing: boolean
  onToggle: (id: number) => void
  onSelectAll: () => void
  onSelectSuggested: () => void
  onClear: () => void
  onBack: () => void
  onInstall: () => void
  visiblePacks: React.ReactNode
}

function formatPrice(value: string | number | null | undefined): string {
  if (value == null) return '—'
  const n = typeof value === 'string' ? parseFloat(value) : value
  if (Number.isNaN(n)) return '—'
  return `${n.toFixed(0)} € HT`
}

function matchTone(score: number, suggested: boolean): 'success' | 'warning' | 'default' {
  if (suggested || score >= 14) return 'success'
  if (score >= 8) return 'warning'
  return 'default'
}

export function OnboardingCatalogPreviewStep({
  products,
  selectedIds,
  technologyLabels,
  replayMode,
  installing,
  onToggle,
  onSelectAll,
  onSelectSuggested,
  onClear,
  onBack,
  onInstall,
  visiblePacks,
}: Props) {
  const selectedCount = selectedIds.length

  return (
    <Box>
      <Box
        sx={{
          mb: 2,
          p: 1.5,
          borderRadius: 1.5,
          bgcolor: (t) => alpha(t.palette.info.main, 0.08),
          border: '1px solid',
          borderColor: (t) => alpha(t.palette.info.main, 0.25),
        }}
      >
        <Typography variant="body2">
          {products.length} proposition(s) pour votre stack —{' '}
          <strong>{selectedCount} sélectionnée(s)</strong>
          {replayMode ? ' pour remplacer le catalogue actuel' : ' à installer'}. Décochez ce qui
          ne vous correspond pas (add-ons, scores faibles).
        </Typography>
      </Box>

      <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 2 }}>
        {technologyLabels.map((label) => (
          <Chip key={label} label={label} size="small" color="primary" variant="outlined" />
        ))}
      </Stack>

      <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 1.5 }}>
        <Button size="small" variant="text" onClick={onSelectSuggested}>
          Cocher les pertinents
        </Button>
        <Button size="small" variant="text" onClick={onSelectAll}>
          Tout cocher
        </Button>
        <Button size="small" variant="text" onClick={onClear}>
          Tout décocher
        </Button>
      </Stack>

      <Stack spacing={0.5} sx={{ maxHeight: 360, overflow: 'auto', mb: 2 }}>
        {products.map((p) => {
          const checked = selectedIds.includes(p.id)
          const tone = matchTone(p.matchScore, p.suggested)
          return (
            <Box
              key={p.id}
              sx={{
                p: 1.25,
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: checked ? 'primary.main' : 'divider',
                bgcolor: checked ? (t) => alpha(t.palette.primary.main, 0.06) : 'background.paper',
              }}
            >
              <FormControlLabel
                sx={{ alignItems: 'flex-start', m: 0, width: '100%' }}
                control={
                  <Checkbox checked={checked} onChange={() => onToggle(p.id)} sx={{ pt: 0.25 }} />
                }
                label={
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" flexWrap="wrap" gap={0.75} sx={{ mb: 0.35 }}>
                      <Typography variant="body2" fontWeight={700}>
                        {p.name}
                      </Typography>
                      <Chip
                        label={`Score ${p.matchScore}`}
                        size="small"
                        color={tone}
                        variant="outlined"
                        sx={{ height: 22, fontSize: '0.68rem' }}
                      />
                      {p.suggested ? (
                        <Chip
                          label="Pertinent"
                          size="small"
                          color="success"
                          sx={{ height: 22, fontSize: '0.68rem' }}
                        />
                      ) : null}
                    </Stack>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {p.sku ?? '—'} · {formatPrice(p.unitPrice)}
                    </Typography>
                    {p.matchReasons.length > 0 && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.35 }}>
                        {p.matchReasons.join(' · ')}
                      </Typography>
                    )}
                    {p.techLabels.length > 0 && (
                      <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.75 }}>
                        {p.techLabels.map((t) => (
                          <Chip
                            key={t}
                            label={t}
                            size="small"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.65rem' }}
                          />
                        ))}
                      </Stack>
                    )}
                  </Box>
                }
              />
            </Box>
          )
        })}
      </Stack>

      {visiblePacks}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Button variant="outlined" onClick={onBack} disabled={installing}>
          Modifier la stack
        </Button>
        <Button
          variant="contained"
          size="large"
          onClick={onInstall}
          disabled={installing || selectedCount === 0}
        >
          {replayMode
            ? `Régénérer (${selectedCount} prestation${selectedCount > 1 ? 's' : ''})`
            : `Installer (${selectedCount} prestation${selectedCount > 1 ? 's' : ''})`}
        </Button>
      </Stack>
    </Box>
  )
}
