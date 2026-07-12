import { DEMO_PERSIST_HINT } from '../hooks/useDemoMode'
import { demoService } from '../services/demoService'
import { trackDemoPersistBlocked } from './demoAnalytics'
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
 * Bloque l'enregistrement en mode démo (ouverture des modales autorisée).
 *
 * @param surface - Contexte analytics (facture, devis, client…)
 * @returns true si l'action de persistance a été bloquée
 */
export function blockDemoPersistIfNeeded(surface = 'form'): boolean {
  if (!demoService.isDemoSession()) return false
  trackDemoPersistBlocked(surface)
  dispatchDemoBlockedEvent(DEMO_PERSIST_HINT, 'DEMO_READ_ONLY')
  return true
}

/**
 * @deprecated Préférer {@link blockDemoPersistIfNeeded}
 */
export function blockDemoCreateIfNeeded(surface = 'form'): boolean {
  return blockDemoPersistIfNeeded(surface)
}

/**
 * Exécute une action de persistance sauf en mode démo.
 *
 * @param onAllowed - Callback si l'enregistrement est autorisé
 * @param surface - Contexte analytics
 */
export function runUnlessDemoPersistBlocked(onAllowed: () => void, surface = 'form'): void {
  if (blockDemoPersistIfNeeded(surface)) return
  onAllowed()
}

/**
 * @deprecated Préférer {@link runUnlessDemoPersistBlocked}
 */
export function runUnlessDemoCreateBlocked(onAllowed: () => void, surface = 'form'): void {
  runUnlessDemoPersistBlocked(onAllowed, surface)
}
