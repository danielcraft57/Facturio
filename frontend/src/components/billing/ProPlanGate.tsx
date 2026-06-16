import { type ReactNode } from 'react'
import { Alert, Box, CircularProgress } from '@mui/material'
import { PlanUpgradePanel } from './PlanUpgradePanel'
import { useBillingGate } from './useBillingGate'

type ProPlanGateProps = {
  children: ReactNode
  featureLabel?: string
}

/**
 * Affiche le contenu uniquement si l'organisation a un plan Pro (API publique incluse).
 */
export function ProPlanGate({ children, featureLabel = 'cette fonctionnalité' }: ProPlanGateProps) {
  const { usage, loading, error } = useBillingGate()

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
        <CircularProgress size={32} />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  if (!usage?.limits.publicApi) {
    return (
      <PlanUpgradePanel
        featureLabel={featureLabel}
        feature="publicApi"
        extraHint="Les jetons et la doc API restent accessibles après passage au Pro, sans reconfiguration de votre compte."
      />
    )
  }

  return <>{children}</>
}
