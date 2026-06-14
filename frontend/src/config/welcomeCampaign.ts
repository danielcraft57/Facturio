/** Fin de campagne popin bienvenue (fin septembre 2026, heure Paris approximative UTC). */
export const WELCOME_CAMPAIGN_END_ISO = '2026-09-30T21:59:59.000Z'

/** Préfixe localStorage : une fois par utilisateur. */
export const WELCOME_CAMPAIGN_STORAGE_PREFIX = 'facturio_welcome_popup_v1'

/**
 * Indique si la popin marketing de bienvenue doit encore être proposée (fenêtre calendaire).
 *
 * @param now - Date de référence (tests)
 */
export function isWelcomeCampaignActive(now: Date = new Date()): boolean {
  return now.getTime() <= new Date(WELCOME_CAMPAIGN_END_ISO).getTime()
}

/**
 * Clé de persistance « déjà vu » pour un utilisateur.
 *
 * @param userId - Identifiant utilisateur Facturio
 */
export function welcomeCampaignStorageKey(userId: string | number): string {
  return `${WELCOME_CAMPAIGN_STORAGE_PREFIX}_${userId}`
}
