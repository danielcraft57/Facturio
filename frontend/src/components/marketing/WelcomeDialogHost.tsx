import { useBillingUsage } from '../../hooks/useBillingUsage'
import { BetaTesterWelcomeDialog } from './BetaTesterWelcomeDialog'
import { FirstLoginWelcomeDialog } from './FirstLoginWelcomeDialog'

/**
 * Choisit la popin de bienvenue : beta testeur actif ou campagne générique Free.
 */
export function WelcomeDialogHost() {
  const { usage, loading } = useBillingUsage()

  if (loading) return null

  if (usage?.betaTester?.active === true) {
    return <BetaTesterWelcomeDialog />
  }

  return <FirstLoginWelcomeDialog />
}
