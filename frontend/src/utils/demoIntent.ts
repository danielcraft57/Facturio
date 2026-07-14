import { resolveDemoHeroInvoicePath } from './demoHeroPaths'

/** Parcours choisi sur `/essayer` avant l'entrée démo. */
export type DemoIntent = 'invoice' | 'start' | 'compliance'

const INTENT_KEY = 'facturio_demo_intent'

/**
 * Mémorise l'intention utilisateur pour la session démo courante.
 *
 * @param intent - Profil choisi sur la page d'entrée
 */
export function setDemoIntent(intent: DemoIntent): void {
  try {
    sessionStorage.setItem(INTENT_KEY, intent)
  } catch {
    /* ignore */
  }
}

/**
 * Retourne l'intention démo mémorisée, ou null.
 */
export function getDemoIntent(): DemoIntent | null {
  try {
    const raw = sessionStorage.getItem(INTENT_KEY)
    if (raw === 'invoice' || raw === 'start' || raw === 'compliance') return raw
  } catch {
    /* ignore */
  }
  return null
}

/** Efface l'intention démo (nouvelle entrée / reset). */
export function clearDemoIntent(): void {
  try {
    sessionStorage.removeItem(INTENT_KEY)
  } catch {
    /* ignore */
  }
}

/**
 * Résout la page d'atterrissage selon le profil choisi.
 *
 * @param intent - Intention utilisateur
 */
export async function resolveDemoLandingForIntent(intent: DemoIntent): Promise<string> {
  if (intent === 'compliance') {
    return '/parametres/facturation-electronique'
  }
  if (intent === 'start') {
    return '/devis/inbox'
  }
  return resolveDemoHeroInvoicePath()
}

/** Libellés affichés sur `/essayer`. */
export const DEMO_INTENT_OPTIONS: Array<{
  id: DemoIntent
  title: string
  subtitle: string
}> = [
  {
    id: 'invoice',
    title: 'Je facture déjà',
    subtitle: 'Voir une facture conforme et son PDF en 30 secondes',
  },
  {
    id: 'start',
    title: 'Je démarre',
    subtitle: 'Parcours devis → facture avec données exemple',
  },
  {
    id: 'compliance',
    title: 'Conformité 2026 d\'abord',
    subtitle: 'Score e-facture sans configurer l\'entreprise',
  },
]
