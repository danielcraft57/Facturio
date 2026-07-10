/** Règle de validation mot de passe inscription (alignée sur `SignupDto` serveur). */
export type SignupPasswordRule = {
  id: string
  label: string
  met: boolean
}

const ASCII_PRINTABLE = /^[\x20-\x7E]*$/

/**
 * Évalue les critères mot de passe pour l'inscription.
 *
 * @param password - Mot de passe saisi
 * @returns Liste des règles avec état rempli / manquant
 */
export function evaluateSignupPasswordRules(password: string): SignupPasswordRule[] {
  return [
    {
      id: 'minLength',
      label: 'Au moins 8 caractères',
      met: password.length >= 8,
    },
    {
      id: 'maxLength',
      label: '128 caractères maximum',
      met: password.length <= 128,
    },
    {
      id: 'ascii',
      label: 'Lettres, chiffres et symboles usuels',
      met: password.length === 0 || ASCII_PRINTABLE.test(password),
    },
  ]
}

/**
 * Indique si le mot de passe respecte toutes les règles serveur.
 *
 * @param password - Mot de passe saisi
 */
export function isSignupPasswordValid(password: string): boolean {
  return evaluateSignupPasswordRules(password).every((rule) => rule.met)
}

/**
 * Indique si la confirmation correspond au mot de passe.
 *
 * @param password - Mot de passe principal
 * @param confirmPassword - Confirmation
 */
export function isSignupPasswordConfirmed(password: string, confirmPassword: string): boolean {
  return confirmPassword.length > 0 && password === confirmPassword
}
