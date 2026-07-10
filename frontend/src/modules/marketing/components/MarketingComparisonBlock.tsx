import { Box, Container, Grid, Typography, alpha, useTheme } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import RemoveIcon from '@mui/icons-material/Remove'
import { ScrollReveal } from './ScrollReveal'
import { MARKETING_COMPARISON } from '../constants/siteContent'

/**
 * Tableau comparatif honnête PrestaFacture vs Indy/Pennylane (pas de faux chiffres).
 */
export function MarketingComparisonBlock() {
  const theme = useTheme()

  return (
    <Box
      sx={{
        py: { xs: 6, md: 8 },
        bgcolor: (t) => alpha(t.palette.grey[500], 0.06),
        borderBlock: 1,
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <ScrollReveal>
          <Typography
            variant="h2"
            align="center"
            sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 700, mb: 1 }}
          >
            {MARKETING_COMPARISON.title}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            align="center"
            sx={{ mb: 1, maxWidth: 640, mx: 'auto' }}
          >
            {MARKETING_COMPARISON.subtitle}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            align="center"
            display="block"
            sx={{ mb: 4, maxWidth: 600, mx: 'auto', fontStyle: 'italic' }}
          >
            {MARKETING_COMPARISON.disclaimer}
          </Typography>
        </ScrollReveal>

        <ScrollReveal delayMs={80}>
          <Box
            sx={{
              borderRadius: 3,
              border: 1,
              borderColor: 'divider',
              overflow: 'hidden',
              bgcolor: 'background.paper',
            }}
          >
            <Grid
              container
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                borderBottom: 1,
                borderColor: 'divider',
                display: { xs: 'none', sm: 'flex' },
              }}
            >
              <Grid size={{ sm: 4 }} sx={{ p: 2 }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  Critère
                </Typography>
              </Grid>
              <Grid size={{ sm: 4 }} sx={{ p: 2, borderLeft: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                  PrestaFacture
                </Typography>
              </Grid>
              <Grid size={{ sm: 4 }} sx={{ p: 2, borderLeft: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                  Indy / Pennylane
                </Typography>
              </Grid>
            </Grid>

            {MARKETING_COMPARISON.rows.map((row, i) => (
              <Grid
                key={row.label}
                container
                sx={{
                  borderBottom: i < MARKETING_COMPARISON.rows.length - 1 ? 1 : 0,
                  borderColor: 'divider',
                }}
              >
                <Grid
                  size={{ xs: 12, sm: 4 }}
                  sx={{ p: { xs: 2, sm: 2 }, bgcolor: { xs: alpha(theme.palette.grey[500], 0.06), sm: 'transparent' } }}
                >
                  <Typography variant="subtitle2" fontWeight={700}>
                    {row.label}
                  </Typography>
                </Grid>
                <Grid
                  size={{ xs: 12, sm: 4 }}
                  sx={{
                    p: 2,
                    borderLeft: { sm: 1 },
                    borderColor: 'divider',
                    display: 'flex',
                    gap: 1,
                    alignItems: 'flex-start',
                  }}
                >
                  <CheckIcon sx={{ fontSize: 18, color: 'primary.main', mt: 0.25, flexShrink: 0 }} />
                  <Box>
                    <Typography variant="caption" color="primary.main" fontWeight={700} sx={{ display: { sm: 'none' }, mb: 0.5 }}>
                      PrestaFacture
                    </Typography>
                    <Typography variant="body2">{row.prestafacture}</Typography>
                  </Box>
                </Grid>
                <Grid
                  size={{ xs: 12, sm: 4 }}
                  sx={{
                    p: 2,
                    borderLeft: { sm: 1 },
                    borderColor: 'divider',
                    display: 'flex',
                    gap: 1,
                    alignItems: 'flex-start',
                  }}
                >
                  <RemoveIcon sx={{ fontSize: 18, color: 'text.disabled', mt: 0.25, flexShrink: 0 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: { sm: 'none' }, mb: 0.5 }}>
                      Indy / Pennylane
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {row.others}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            ))}
          </Box>
        </ScrollReveal>
      </Container>
    </Box>
  )
}
