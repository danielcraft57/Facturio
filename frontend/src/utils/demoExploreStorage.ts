const PREFIX = 'facturio_demo_explore_'

export type DemoExploreStepId = 'see-invoice' | 'see-quote' | 'see-efacture'

const STEPS: DemoExploreStepId[] = ['see-invoice', 'see-quote', 'see-efacture']

function key(step: DemoExploreStepId): string {
  return `${PREFIX}${step}`
}

/** Marque une étape du parcours démo comme complétée. */
export function markDemoExploreStep(step: DemoExploreStepId): void {
  try {
    localStorage.setItem(key(step), '1')
  } catch {
    /* ignore */
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

/** Popin de bienvenue démo déjà affichée ? */
export function hasSeenDemoWelcome(): boolean {
  try {
    return localStorage.getItem(WELCOME_KEY) === '1'
  } catch {
    return true
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

const QUEST_RECAP_KEY = `${PREFIX}quest_recap_seen`

/** Récap quêtes démo déjà affiché ? */
export function hasSeenDemoQuestRecap(): boolean {
  try {
    return localStorage.getItem(QUEST_RECAP_KEY) === '1'
  } catch {
    return true
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
