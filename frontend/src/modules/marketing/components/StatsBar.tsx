import { Box, Container, Typography, alpha } from '@mui/material'
import { AnimatedCounter } from './AnimatedCounter'
import { ScrollReveal } from './ScrollReveal'

const STATS = [
  { value: 10, suffix: '+', label: 'prestations types dans le catalogue' },
  { value: 2026, suffix: '', label: 'échéance réforme B2B' },
  { value: 4, suffix: '', label: 'paliers tarifaires simples' },
  { value: 100, suffix: '%', label: 'vertical prestations numériques' },
] as const

export function StatsBar() {
  return (
    <Box sx={{ py: { xs: 5, md: 6 }, bgcolor: (t) => alpha(t.palette.primary.main, 0.06) }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 3,
            textAlign: 'center',
          }}
        >
          {STATS.map((stat, i) => (
            <ScrollReveal key={stat.label} delayMs={i * 80}>
              <AnimatedCounter
                value={stat.value}
                suffix={stat.suffix}
                variant="h4"
                component="p"
                sx={{ fontWeight: 800, color: 'primary.main', lineHeight: 1.2 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {stat.label}
              </Typography>
            </ScrollReveal>
          ))}
        </Box>
      </Container>
    </Box>
  )
}
