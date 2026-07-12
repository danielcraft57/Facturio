import { GA_EVENTS, trackActivationEvent } from '../config/analyticsEvents'
import { demoService } from '../services/demoService'

/** Surfaces formulaire suivies en mode démo. */
export type DemoFormSurface = 'invoice' | 'quote' | 'client' | 'product'

const previewTracked = new Set<string>()

/**
 * Enregistre l'ouverture d'un formulaire en aperçu démo (une fois par surface et session).
 *
 * @param surface - Type de formulaire ouvert
 */
export function trackDemoFormPreviewOpened(surface: DemoFormSurface): void {
  if (!demoService.isDemoSession()) return
  if (previewTracked.has(surface)) return
  previewTracked.add(surface)
  trackActivationEvent(GA_EVENTS.DEMO_FORM_PREVIEW, { form: surface })
}

/**
 * Enregistre une tentative d'enregistrement bloquée en démo.
 *
 * @param surface - Contexte (facture, client, etc.)
 */
export function trackDemoPersistBlocked(surface: string): void {
  if (!demoService.isDemoSession()) return
  trackActivationEvent(GA_EVENTS.DEMO_PERSIST_BLOCKED, { form: surface })
}

/**
 * Réinitialise le suivi aperçu (nouvelle entrée démo).
 */
export function resetDemoAnalyticsSession(): void {
  previewTracked.clear()
}
