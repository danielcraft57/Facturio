import { Typography, Box } from '@mui/material'
import { BillingPlanSection } from '../BillingPlanSection'

export function SettingsBillingPage() {
  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
        Abonnement
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Votre plan Facturio, quotas de factures et passage au Pro.
      </Typography>
      <BillingPlanSection />
    </Box>
  )
}
