import { useEffect } from 'react'

/**
 * Détecte si la plateforme utilise la touche Meta (macOS).
 */
function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform)
}

/**
 * Écoute le raccourci global Ctrl+K / Cmd+K pour ouvrir la palette de commandes.
 *
 * @param onOpen - Callback déclenché à l'appui du raccourci
 * @param enabled - Désactive l'écoute si false (ex. palette déjà ouverte gérée ailleurs)
 */
export function useCommandPaletteShortcut(onOpen: () => void, enabled = true): void {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const modifier = isMacPlatform() ? event.metaKey : event.ctrlKey
      if (!modifier || event.key.toLowerCase() !== 'k') return
      if (event.shiftKey || event.altKey) return

      event.preventDefault()
      onOpen()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, onOpen])
}
