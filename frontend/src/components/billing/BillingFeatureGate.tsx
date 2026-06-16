import { type ReactNode } from 'react'
import { Alert, Box, CircularProgress } from '@mui/material'
import { PlanUpgradePanel } from './PlanUpgradePanel'
import { useBillingGate } from './useBillingGate'

export type BillingGatedFeature = 'publicApi' | 'accounting' | 'financeModule'

type BillingFeatureGateProps = {
  children: ReactNode
  feature: BillingGatedFeature
  featureLabel?: string
  highlights?: string[]
}

/**
 * Affiche le contenu uniquement si le plan inclut la fonctionnalité demandée.
 */
export function BillingFeatureGate({
  children,
  feature,
  featureLabel = 'cette fonctionnalité',
  highlights,
}: BillingFeatureGateProps) {
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

  if (!usage?.limits[feature]) {
    return (
      <PlanUpgradePanel featureLabel={featureLabel} feature={feature} highlights={highlights} />
    )
  }

  return <>{children}</>
}
