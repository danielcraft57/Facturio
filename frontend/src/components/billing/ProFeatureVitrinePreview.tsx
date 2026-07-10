import { Box, Card, CardContent, Skeleton, Stack, Typography, alpha, useTheme } from '@mui/material'

/** Variante d'aperçu vitrine Pro (compta, finance, conformité). */
export type ProVitrineVariant = 'accounting' | 'finance' | 'compliance'

const PREVIEW_META: Record<
  ProVitrineVariant,
  { title: string; rows: string[] }
> = {
  accounting: {
    title: 'Aperçu — Comptabilité',
    rows: ['Grand livre', 'Balance générale', 'Export FEC', 'Rapprochement TVA'],
  },
  finance: {
    title: 'Aperçu — Module finance',
    rows: ['Créances clients', 'Relances impayées', 'Dettes fournisseurs', 'Encours synchronisé'],
  },
  compliance: {
    title: 'Aperçu — Conformité e-facture',
    rows: ['Score par facture', 'Checklist SIRET / SIREN', 'Export Factur-X', 'Suivi réforme 2026'],
  },
}

type Props = {
  variant: ProVitrineVariant
}

/**
 * Maquette statique (sans fausses données) affichée derrière la vitrine Pro.
 */
export function ProFeatureVitrinePreview({ variant }: Props) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const meta = PREVIEW_META[variant]

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 2.5,
        borderRadius: 2.5,
        overflow: 'hidden',
        borderColor: isDark ? alpha('#fff', 0.12) : alpha('#0f172a', 0.1),
        bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#0f172a', 0.02),
        pointerEvents: 'none',
        userSelect: 'none',
      }}
      aria-hidden
    >
      <CardContent sx={{ p: 2 }}>
        <Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: '0.08em', color: 'text.secondary' }}>
          {meta.title}
        </Typography>
        <Stack spacing={1.25} sx={{ mt: 1.5 }}>
          {meta.rows.map((label) => (
            <Box key={label}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                {label}
              </Typography>
              <Skeleton
                variant="rounded"
                height={28}
                animation={false}
                sx={{
                  bgcolor: isDark ? alpha('#fff', 0.08) : alpha('#0f172a', 0.06),
                  borderRadius: 1,
                }}
              />
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}
