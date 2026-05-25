import type { User } from '../services/authService'
import { onboardingService } from '../services/onboardingService'

/** Chemin après connexion / rechargement selon onboarding et email. */
export async function resolvePostAuthPath(user: User | null): Promise<string> {
  if (user?.emailVerified !== true) {
    try {
      const status = await onboardingService.getStatus()
      if (!status.completed) return '/installation'
      return '/inscription/confirmation'
    } catch {
      return '/installation'
    }
  }
  return '/dashboard'
}
