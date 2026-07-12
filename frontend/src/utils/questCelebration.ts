import type { ToastApi } from '../components/useToast'

type QuestUnlockToast = {
  title: string
  message: string
}

/**
 * Toast « étape validée » partagé (démo + activation compte).
 *
 * @param toast - API toast de l'app
 * @param unlock - Titre court et message de déblocage
 */
export function celebrateQuestStepUnlock(toast: ToastApi, unlock: QuestUnlockToast): void {
  toast.success(unlock.message, {
    title: `Niveau débloqué — ${unlock.title}`,
    duration: 6000,
  })
}
