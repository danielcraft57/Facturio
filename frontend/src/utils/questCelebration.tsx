import { Button } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import type { ToastApi } from '../components/useToast'

type QuestUnlockToast = {
  title: string
  message: string
  nextAction?: { label: string; to: string }
}

/**
 * Toast « étape validée » partagé (démo + activation compte).
 *
 * @param toast - API toast de l'app
 * @param unlock - Titre, message et action unique optionnelle
 */
export function celebrateQuestStepUnlock(toast: ToastApi, unlock: QuestUnlockToast): void {
  toast.success(unlock.message, {
    title: `Niveau débloqué — ${unlock.title}`,
    duration: 8_000,
    action: unlock.nextAction ? (
      <Button component={RouterLink} to={unlock.nextAction.to} size="small" color="inherit">
        {unlock.nextAction.label}
      </Button>
    ) : undefined,
  })
}
