import { welcomeCampaignStorageKey } from '../config/welcomeCampaign'

/**
 * La popin de bienvenue a-t-elle déjà été fermée pour cet utilisateur ?
 *
 * @param userId - Identifiant utilisateur
 */
export function hasSeenWelcomeCampaign(userId: string | number): boolean {
  try {
    return localStorage.getItem(welcomeCampaignStorageKey(userId)) === '1'
  } catch {
    return true
  }
}

/**
 * Marque la popin comme vue (fermeture ou CTA principal).
 *
 * @param userId - Identifiant utilisateur
 */
export function markWelcomeCampaignSeen(userId: string | number): void {
  try {
    localStorage.setItem(welcomeCampaignStorageKey(userId), '1')
  } catch {
    /* quota / mode privé */
  }
}
