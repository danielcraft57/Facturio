/**
 * Récupère un JWT OAuth passé en fragment URL (#access_token=…) puis nettoie l'URL.
 * Utilisé en dev quand le cookie httpOnly ne traverse pas le proxy Vite.
 *
 * @returns Token consommé ou null
 */
export function consumeOAuthAccessTokenFromHash(): string | null {
  if (typeof window === 'undefined') return null
  const hash = window.location.hash.replace(/^#/, '')
  if (!hash) return null

  const params = new URLSearchParams(hash)
  const token = params.get('access_token')?.trim()
  if (!token) return null

  localStorage.setItem('auth_token', token)
  const cleanUrl = `${window.location.pathname}${window.location.search}`
  window.history.replaceState(null, '', cleanUrl)
  return token
}
