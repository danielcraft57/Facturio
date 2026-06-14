/** Préfixe localStorage : popin bienvenue beta testeur (une fois par utilisateur). */
export const BETA_WELCOME_STORAGE_PREFIX = 'facturio_beta_welcome_popup_v1'

/**
 * La popin beta a-t-elle déjà été fermée pour cet utilisateur ?
 *
 * @param userId - Identifiant utilisateur
 */
export function hasSeenBetaWelcome(userId: string | number): boolean {
  try {
    return localStorage.getItem(`${BETA_WELCOME_STORAGE_PREFIX}_${userId}`) === '1'
  } catch {
    return true
  }
}

/**
 * Marque la popin beta comme vue.
 *
 * @param userId - Identifiant utilisateur
 */
export function markBetaWelcomeSeen(userId: string | number): void {
  try {
    localStorage.setItem(`${BETA_WELCOME_STORAGE_PREFIX}_${userId}`, '1')
  } catch {
    /* quota / mode privé */
  }
}
