import { useBillingUsage } from '../../hooks/useBillingUsage'
import { DemoWelcomeDialog } from '../demo/DemoWelcomeDialog'
import { demoService } from '../../services/demoService'
import { BetaTesterWelcomeDialog } from './BetaTesterWelcomeDialog'
import { FirstLoginWelcomeDialog } from './FirstLoginWelcomeDialog'
import { ActivationWelcomeDialog } from './ActivationWelcomeDialog'
import { isWelcomeCampaignActive } from '../../config/welcomeCampaign'

/**
 * Choisit la popin de bienvenue : démo, beta testeur actif, activation compte neuf ou campagne générique Free.
 */
export function WelcomeDialogHost() {
  const { usage, loading } = useBillingUsage()

  if (demoService.isDemoSession()) {
    return <DemoWelcomeDialog />
  }

  if (loading) return null

  if (usage?.betaTester?.active === true) {
    return <BetaTesterWelcomeDialog />
  }

  if (!isWelcomeCampaignActive()) {
    return <ActivationWelcomeDialog />
  }

  return <FirstLoginWelcomeDialog />
}
