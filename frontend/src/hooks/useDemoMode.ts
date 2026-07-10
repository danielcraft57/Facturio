import { demoService } from '../services/demoService'

/** Indique si la session courante est l'espace démo partagé. */
export function useDemoMode(): boolean {
  return demoService.isDemoSession()
}

/** Message standard pour les actions bloquées en démo (erreur qui guide). */
export const DEMO_CREATE_HINT =
  'En démo vous explorez des exemples. Inscrivez-vous gratuitement pour créer votre première facture ou devis.'

/** Message aligné avec l'API backend (lecture seule démo). */
export const DEMO_API_READ_ONLY_MESSAGE =
  'En démo vous explorez des exemples. Inscrivez-vous gratuitement pour modifier ou créer vos documents.'
