import { DEMO_CREATE_HINT } from '../hooks/useDemoMode'
import { demoService } from '../services/demoService'
import { dispatchDemoBlockedEvent } from './quotaNotifications'

/**
 * Indique si l'URL ouvre une modale de création (?create=1).
 *
 * @param path - Chemin ou URL relative
 */
export function isDocumentCreateUrl(path: string): boolean {
  return /(?:\?|&)create=1(?:&|$)/.test(path)
}

/**
 * Bloque l'action de création en mode démo et affiche le toast guidé.
 *
 * @returns true si l'action a été bloquée
 */
export function blockDemoCreateIfNeeded(): boolean {
  if (!demoService.isDemoSession()) return false
  dispatchDemoBlockedEvent(DEMO_CREATE_HINT, 'DEMO_READ_ONLY')
  return true
}

/**
 * Exécute une navigation ou une action de création, sauf en mode démo.
 *
 * @param onAllowed - Callback si la création est autorisée
 */
export function runUnlessDemoCreateBlocked(onAllowed: () => void): void {
  if (blockDemoCreateIfNeeded()) return
  onAllowed()
}
