import { demoService } from '../services/demoService'

/** Indique si la session courante est l'espace démo partagé. */
export function useDemoMode(): boolean {
  return demoService.isDemoSession()
}

/** Message pour les boutons d'ouverture en démo (aperçu). */
export const DEMO_CREATE_HINT =
  'Aperçu interactif — inscrivez-vous gratuitement pour enregistrer vos documents.'

/** Message affiché à la tentative d'enregistrement en démo. */
export const DEMO_PERSIST_HINT =
  'Enregistrement désactivé en démo. Créez votre compte gratuit pour sauvegarder.'

/** Message aligné avec l'API backend (lecture seule démo). */
export const DEMO_API_READ_ONLY_MESSAGE =
  'En démo vous explorez des exemples. Inscrivez-vous gratuitement pour modifier ou créer vos documents.'

/**
 * Libellé du bouton principal de formulaire en mode démo.
 *
 * @param saveLabel - Libellé normal (hors démo)
 */
export function getDemoSubmitLabel(saveLabel: string): string {
  return demoService.isDemoSession() ? 'Aperçu — inscription pour enregistrer' : saveLabel
}
