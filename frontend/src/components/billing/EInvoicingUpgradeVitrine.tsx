import { Alert, Box, CircularProgress } from '@mui/material'
import { PlanUpgradePanel } from './PlanUpgradePanel'
import { useBillingGate } from './useBillingGate'

/**
 * Bannière vitrine Pro + e-facture sur la page paramètres (sans masquer l'indicateur de base).
 */
export function EInvoicingUpgradeVitrine() {
  const { usage, loading, error } = useBillingGate()

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, mb: 2 }}>
        <CircularProgress size={24} />
      </Box>
    )
  }

  if (error || usage?.limits.eInvoicing) {
    return null
  }

  return (
    <Box sx={{ mb: 3 }}>
      <PlanUpgradePanel
        feature="compliance"
        featureLabel="Le rapport de conformité e-facture détaillé"
        previewVariant="compliance"
        compact
        extraHint="L'indicateur de base reste disponible ci-dessous. Le palier Pro + e-facture débloque le rapport complet et les exports de préparation."
      />
    </Box>
  )
}
