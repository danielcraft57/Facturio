const PREFIX = 'facturio_activation_'
const WELCOME_SUFFIX = 'welcome_seen'
const QUEST_RECAP_SUFFIX = 'quest_recap_seen'
const STEP_HISTORY_SUFFIX = 'step_history'

export type AccountActivationStepId = 'setup-company' | 'first-invoice' | 'first-client'

export type ActivationHistoryEntry = {
  step: AccountActivationStepId
  completedAt: string
}

const STEPS: AccountActivationStepId[] = ['setup-company', 'first-invoice', 'first-client']

type ActivationUserId = string | number

function stepKey(userId: ActivationUserId, step: AccountActivationStepId): string {
  return `${PREFIX}${userId}_${step}`
}

/**
 * Marque une étape d'activation compte comme complétée.
 *
 * @param userId - Identifiant utilisateur
 * @param step - Étape du parcours
 */
export function markAccountActivationStep(userId: ActivationUserId, step: AccountActivationStepId): void {
  try {
    if (isAccountActivationStepDone(userId, step)) return
    localStorage.setItem(stepKey(userId, step), '1')
    const history = getActivationStepHistory(userId)
    history.push({ step, completedAt: new Date().toISOString() })
    localStorage.setItem(userKey(userId, STEP_HISTORY_SUFFIX), JSON.stringify(history))
  } catch {
    /* ignore */
  }
}

/**
 * Historique chronologique des étapes validées.
 *
 * @param userId - Identifiant utilisateur
 * @returns Entrées triées par date de validation
 */
export function getActivationStepHistory(userId: ActivationUserId): ActivationHistoryEntry[] {
  try {
    const raw = localStorage.getItem(userKey(userId, STEP_HISTORY_SUFFIX))
    if (!raw) return []
    const parsed = JSON.parse(raw) as ActivationHistoryEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Indique si l'étape d'activation a déjà été cochée.
 *
 * @param userId - Identifiant utilisateur
 * @param step - Étape du parcours
 */
export function isAccountActivationStepDone(userId: ActivationUserId, step: AccountActivationStepId): boolean {
  try {
    return localStorage.getItem(stepKey(userId, step)) === '1'
  } catch {
    return false
  }
}

/**
 * Progression du parcours d'activation (0–3).
 *
 * @param userId - Identifiant utilisateur
 */
export function accountActivationProgress(userId: ActivationUserId): {
  done: number
  total: number
  steps: AccountActivationStepId[]
} {
  const done = STEPS.filter((step) => isAccountActivationStepDone(userId, step)).length
  return { done, total: STEPS.length, steps: STEPS }
}

function userKey(userId: ActivationUserId, suffix: string): string {
  return `${PREFIX}${userId}_${suffix}`
}

/** Popin d'activation déjà affichée pour ce compte ? */
export function hasSeenActivationWelcome(userId: ActivationUserId): boolean {
  try {
    return localStorage.getItem(userKey(userId, WELCOME_SUFFIX)) === '1'
  } catch {
    return true
  }
}

/** Enregistre la popin d'activation comme vue. */
export function markActivationWelcomeSeen(userId: ActivationUserId): void {
  try {
    localStorage.setItem(userKey(userId, WELCOME_SUFFIX), '1')
  } catch {
    /* ignore */
  }
}

/** Récap quêtes activation déjà affiché ? */
export function hasSeenActivationQuestRecap(userId: ActivationUserId): boolean {
  try {
    return localStorage.getItem(userKey(userId, QUEST_RECAP_SUFFIX)) === '1'
  } catch {
    return true
  }
}

/** Enregistre le récap quêtes activation comme vu. */
export function markActivationQuestRecapSeen(userId: ActivationUserId): void {
  try {
    localStorage.setItem(userKey(userId, QUEST_RECAP_SUFFIX), '1')
  } catch {
    /* ignore */
  }
}

const FIRST_INVOICE_TRACKED = `${PREFIX}first_invoice_tracked`

/** Événement GA `first_invoice_created` déjà envoyé sur cet appareil ? */
export function wasFirstInvoiceTracked(): boolean {
  try {
    return localStorage.getItem(FIRST_INVOICE_TRACKED) === '1'
  } catch {
    return false
  }
}

/** Marque l'événement première facture comme envoyé. */
export function markFirstInvoiceTracked(): void {
  try {
    localStorage.setItem(FIRST_INVOICE_TRACKED, '1')
  } catch {
    /* ignore */
  }
}

const FIRST_PDF_TRACKED = `${PREFIX}first_pdf_tracked`

/** Événement GA `first_pdf_downloaded` déjà envoyé sur cet appareil ? */
export function wasFirstPdfTracked(): boolean {
  try {
    return localStorage.getItem(FIRST_PDF_TRACKED) === '1'
  } catch {
    return false
  }
}

/** Marque l'événement premier PDF comme envoyé. */
export function markFirstPdfTracked(): void {
  try {
    localStorage.setItem(FIRST_PDF_TRACKED, '1')
  } catch {
    /* ignore */
  }
}
