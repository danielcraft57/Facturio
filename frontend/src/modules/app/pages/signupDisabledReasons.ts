/**
 * Raisons pour lesquelles le bouton « Créer mon compte » reste désactivé.
 */
export function getSignupSubmitDisabledReasons(params: {
  pending: boolean
  email: string
  organizationName: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
  acceptPrivacy: boolean
  isLoading: boolean
}): string[] {
  const reasons: string[] = []

  if (params.isLoading) {
    reasons.push('Création du compte en cours…')
    return reasons
  }

  if (params.pending) {
    reasons.push('Un compte est déjà en attente de validation par email')
  }
  if (!params.email.trim()) {
    reasons.push('Indiquez votre email')
  }
  if (!params.organizationName.trim()) {
    reasons.push('Indiquez le nom de votre organisation')
  }
  if (!params.password) {
    reasons.push('Choisissez un mot de passe')
  } else if (params.password.length < 8) {
    reasons.push('Le mot de passe doit contenir au moins 8 caractères')
  }
  if (!params.confirmPassword) {
    reasons.push('Confirmez votre mot de passe')
  } else if (
    params.password &&
    params.confirmPassword &&
    params.password !== params.confirmPassword
  ) {
    reasons.push('Les mots de passe ne correspondent pas')
  }
  if (!params.acceptTerms) {
    reasons.push('Acceptez les conditions générales d\'utilisation')
  }
  if (!params.acceptPrivacy) {
    reasons.push('Acceptez la politique de confidentialité')
  }

  return reasons
}

/**
 * Raisons pour lesquelles « Continuer avec Google » reste désactivé (inscription).
 */
export function getGoogleSignupDisabledReasons(params: {
  acceptTerms: boolean
  acceptPrivacy: boolean
}): string[] {
  const reasons: string[] = []
  if (!params.acceptTerms) {
    reasons.push('Acceptez les conditions générales d\'utilisation')
  }
  if (!params.acceptPrivacy) {
    reasons.push('Acceptez la politique de confidentialité')
  }
  return reasons
}

/**
 * Raisons pour lesquelles « Se connecter » reste désactivé.
 */
export function getLoginSubmitDisabledReasons(params: {
  email: string
  password: string
  isLoading: boolean
}): string[] {
  const reasons: string[] = []

  if (params.isLoading) {
    reasons.push('Connexion en cours…')
    return reasons
  }
  if (!params.email.trim()) {
    reasons.push('Indiquez votre email')
  }
  if (!params.password) {
    reasons.push('Indiquez votre mot de passe')
  }

  return reasons
}
