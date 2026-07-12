import { useEffect, useRef, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useBillingUsage } from '../../hooks/useBillingUsage'
import { demoService } from '../../services/demoService'
import { useToast } from '../useToast'
import {
  accountActivationProgress,
  hasSeenActivationQuestRecap,
  isAccountActivationStepDone,
  markAccountActivationStep,
  markActivationQuestRecapSeen,
  type AccountActivationStepId,
} from '../../utils/accountActivationStorage'
import { ActivationQuestCompleteDialog } from './ActivationQuestCompleteDialog'
import { ActivationProgressHistory } from './ActivationProgressHistory'
import { ACTIVATION_UNLOCK_COPY } from './activationUnlockCopy'
import { celebrateQuestStepUnlock } from '../../utils/questCelebration'
import { GA_EVENTS, trackActivationEvent } from '../../config/analyticsEvents'
import {
  QUEST_COLORS,
  questBadgeChipSx,
  questCtaOutlinedSx,
  questHudSurfaceSx,
  questProgressBarSx,
  questStepBulletSx,
  questStepRowSx,
} from '../demo/demoTheme'

const STEPS: Array<{
  id: AccountActivationStepId
  label: string
  to: string
  match?: RegExp
}> = [
  {
    id: 'setup-company',
    label: 'Infos entreprise',
    to: '/parametres/entreprise',
    match: /^\/parametres\/entreprise/,
  },
  {
    id: 'first-invoice',
    label: 'Première facture',
    to: '/factures/inbox?create=1',
  },
  {
    id: 'first-client',
    label: 'Premier client',
    to: '/clients/inbox?create=1',
  },
]

/**
 * HUD quêtes d'activation sur le tableau de bord (comptes réels, 0 facture).
 */
export function AccountActivationChecklist() {
  const location = useLocation()
  const toast = useToast()
  const user = useAuthStore((s) => s.user)
  const { usage, loading } = useBillingUsage()
  const [tick, setTick] = useState(0)
  const [recapOpen, setRecapOpen] = useState(false)
  const [celebrateStep, setCelebrateStep] = useState<AccountActivationStepId | null>(null)
  const completionTracked = useRef(false)

  const userId = user?.id
  const isDemo = demoService.isDemoSession()
  const hasInvoices = (usage?.usage?.invoicesThisMonth ?? 0) > 0

  const showChecklist =
    !!userId &&
    !isDemo &&
    !loading &&
    usage?.betaTester?.active !== true &&
    !hasInvoices

  const { done, total } = userId ? accountActivationProgress(userId) : { done: 0, total: STEPS.length }
  const allDone = showChecklist && done >= total
  const recapSeen = userId ? hasSeenActivationQuestRecap(userId) : true

  useEffect(() => {
    if (!showChecklist || !userId) return
    for (const step of STEPS) {
      if (!step.match?.test(location.pathname)) continue
      if (isAccountActivationStepDone(userId, step.id)) continue
      markAccountActivationStep(userId, step.id)
      setTick((n) => n + 1)
      setCelebrateStep(step.id)
      celebrateQuestStepUnlock(toast, ACTIVATION_UNLOCK_COPY[step.id])
      window.setTimeout(() => setCelebrateStep(null), 500)
    }
  }, [showChecklist, userId, location.pathname, toast])

  useEffect(() => {
    if (!allDone || completionTracked.current) return
    completionTracked.current = true
    trackActivationEvent(GA_EVENTS.ACTIVATION_QUEST_COMPLETED, { quest_count: total })
    if (!recapSeen) {
      setRecapOpen(true)
    }
  }, [allDone, total, recapSeen])

  if (!showChecklist) return null

  void tick

  if (allDone) {
    return (
      <>
        <ActivationQuestCompleteDialog
          open={recapOpen}
          onClose={() => {
            if (userId) markActivationQuestRecapSeen(userId)
            setRecapOpen(false)
          }}
        />
        {recapSeen && !recapOpen && userId && (
          <ActivationProgressHistory userId={userId} compact />
        )}
      </>
    )
  }

  const progressPct = (done / total) * 100

  return (
    <Card variant="outlined" sx={{ mb: 2, ...questHudSurfaceSx('light') }}>
      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
        <Stack spacing={1.5}>
          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <EmojiEventsIcon sx={{ color: QUEST_COLORS.main, fontSize: 22 }} />
                <Typography variant="subtitle1" fontWeight={800}>
                  Quêtes — premiers pas
                </Typography>
              </Stack>
              <Chip label={`${done}/${total}`} size="small" sx={questBadgeChipSx()} />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Trois actions pour débloquer votre flux de facturation.
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progressPct}
              sx={{ mt: 1.25, ...questProgressBarSx() }}
            />
          </Box>
          <Stack spacing={0.75}>
            {STEPS.map((step, index) => {
              const completed = userId ? isAccountActivationStepDone(userId, step.id) : false
              const isNext =
                !completed &&
                STEPS.slice(0, index).every((s) =>
                  userId ? isAccountActivationStepDone(userId, s.id) : false,
                )
              const celebrating = celebrateStep === step.id
              return (
                <Stack
                  key={step.id}
                  direction="row"
                  alignItems="center"
                  spacing={1.25}
                  component={completed ? 'div' : RouterLink}
                  to={completed ? undefined : step.to}
                  sx={{
                    textDecoration: 'none',
                    color: 'inherit',
                    ...questStepRowSx(isNext || celebrating, completed),
                  }}
                >
                  <Box sx={questStepBulletSx(completed, isNext || celebrating)}>
                    {completed ? <CheckCircleOutlineIcon sx={{ fontSize: 16 }} /> : index + 1}
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: completed ? 500 : isNext ? 700 : 600,
                      color: completed ? 'text.secondary' : 'text.primary',
                      textDecoration: completed ? 'line-through' : 'none',
                    }}
                  >
                    {step.label}
                  </Typography>
                </Stack>
              )
            })}
          </Stack>
          {userId && done > 0 && <ActivationProgressHistory userId={userId} />}
          <Button
            component={RouterLink}
            to="/factures/inbox?create=1"
            size="small"
            variant="outlined"
            sx={questCtaOutlinedSx()}
          >
            Créer une facture
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}
