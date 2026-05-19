import { Box, Container, Paper, Typography } from '@mui/material'
import { REFORM_STEPS } from '../constants/siteContent'

export function ReformTimeline() {
  return (
    <Box sx={{ py: { xs: 6, md: 8 } }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 3,
          }}
        >
          {REFORM_STEPS.map((step) => (
            <Paper key={step.title} variant="outlined" sx={{ p: 3, height: '100%', borderRadius: 3 }}>
              <Typography variant="overline" color="primary.main" fontWeight={700}>
                {step.date}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, my: 1 }}>
                {step.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {step.body}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Container>
    </Box>
  )
}
