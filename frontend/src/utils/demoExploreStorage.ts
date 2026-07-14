const PREFIX = 'facturio_demo_explore_'
const STEP_HISTORY_KEY = `${PREFIX}step_history`

export type DemoExploreStepId = 'see-invoice' | 'see-quote' | 'see-efacture'

export type DemoExploreHistoryEntry = {
  step: DemoExploreStepId
  completedAt: string
}

const STEPS: DemoExploreStepId[] = ['see-invoice', 'see-quote', 'see-efacture']

function key(step: DemoExploreStepId): string {
  return `${PREFIX}${step}`
}

/**
 * Marque une étape du parcours démo comme complétée.
 *
 * @param step - Étape visitée
 */
export function markDemoExploreStep(step: DemoExploreStepId): void {
  try {
    if (isDemoExploreStepDone(step)) return
    localStorage.setItem(key(step), '1')
    const history = getDemoExploreStepHistory()
    history.push({ step, completedAt: new Date().toISOString() })
    localStorage.setItem(STEP_HISTORY_KEY, JSON.stringify(history))
  } catch {
    /* ignore */
  }
}

/**
 * Historique chronologique des étapes démo validées.
 */
export function getDemoExploreStepHistory(): DemoExploreHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STEP_HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as DemoExploreHistoryEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** Indique si l'étape a déjà été cochée. */
export function isDemoExploreStepDone(step: DemoExploreStepId): boolean {
  try {
    return localStorage.getItem(key(step)) === '1'
  } catch {
    return false
  }
}

/** Progression du parcours démo (0–3). */
export function demoExploreProgress(): { done: number; total: number; steps: DemoExploreStepId[] } {
  const done = STEPS.filter(isDemoExploreStepDone).length
  return { done, total: STEPS.length, steps: STEPS }
}

const WELCOME_KEY = `${PREFIX}welcome_seen`
const WELCOME_SKIPPED_KEY = `${PREFIX}welcome_skipped`
const CMDK_HINT_KEY = `${PREFIX}cmdk_hint_seen`

/** Popin de bienvenue démo déjà affichée ? */
export function hasSeenDemoWelcome(): boolean {
  try {
    return localStorage.getItem(WELCOME_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Réinitialise la progression locale démo (parcours, welcome, récap).
 * Appelé à chaque nouvelle entrée via /essayer pour réafficher les modales.
 */
export function resetDemoExploreState(): void {
  try {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith(PREFIX)) keysToRemove.push(k)
    }
    for (const k of keysToRemove) {
      localStorage.removeItem(k)
    }
  } catch {
    /* ignore */
  }
}

/** Enregistre la popin de bienvenue démo comme vue. */
export function markDemoWelcomeSeen(): void {
  try {
    localStorage.setItem(WELCOME_KEY, '1')
  } catch {
    /* ignore */
  }
}

/**
 * Marque que l'utilisateur a choisi « Explorer seul » (filet contextuel ensuite).
 */
export function markDemoWelcomeSkipped(): void {
  try {
    localStorage.setItem(WELCOME_SKIPPED_KEY, '1')
  } catch {
    /* ignore */
  }
}

/** L'utilisateur a passé la welcome sans suivre le CTA principal ? */
export function hasSkippedDemoWelcome(): boolean {
  try {
    return localStorage.getItem(WELCOME_SKIPPED_KEY) === '1'
  } catch {
    return false
  }
}

/** Astuce Cmd+K déjà affichée après skip welcome ? */
export function hasSeenDemoCmdkHint(): boolean {
  try {
    return localStorage.getItem(CMDK_HINT_KEY) === '1'
  } catch {
    return false
  }
}

/** Enregistre l'astuce Cmd+K comme vue. */
export function markDemoCmdkHintSeen(): void {
  try {
    localStorage.setItem(CMDK_HINT_KEY, '1')
  } catch {
    /* ignore */
  }
}

const QUEST_RECAP_KEY = `${PREFIX}quest_recap_seen`

/** Récap quêtes démo déjà affiché ? */
export function hasSeenDemoQuestRecap(): boolean {
  try {
    return localStorage.getItem(QUEST_RECAP_KEY) === '1'
  } catch {
    return false
  }
}

/** Enregistre le récap quêtes démo comme vu. */
export function markDemoQuestRecapSeen(): void {
  try {
    localStorage.setItem(QUEST_RECAP_KEY, '1')
  } catch {
    /* ignore */
  }
}
