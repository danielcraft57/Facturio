import { Navigate } from 'react-router-dom'
import { Alert, Box, Typography } from '@mui/material'
import { useBillingUsage } from '../../../hooks/useBillingUsage'
import { QuotaUsagePanel, QuotaUsagePanelSkeleton } from '../components/QuotaUsagePanel'

/**
 * Page paramètres — détail des quotas mensuels (plan Free uniquement).
 */
export function SettingsQuotasPage() {
  const { usage, loading } = useBillingUsage()

  if (loading) {
    return (
      <Box>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Quotas & usage
        </Typography>
        <QuotaUsagePanelSkeleton />
      </Box>
    )
  }

  if (!usage) {
    return (
      <Alert severity="warning">
        Impossible de charger les quotas. Vérifiez que le serveur API est démarré.
      </Alert>
    )
  }

  if (usage.plan !== 'FREE') {
    return <Navigate to="/parametres/abonnement" replace />
  }

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
        Quotas & usage
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Suivez votre consommation mensuelle sur le plan Free.
      </Typography>
      <QuotaUsagePanel usage={usage} />
    </Box>
  )
}
