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
import { demoService } from '../../services/demoService'
import { useToast } from '../useToast'
import {
  demoExploreProgress,
  hasSeenDemoQuestRecap,
  isDemoExploreStepDone,
  markDemoExploreStep,
  type DemoExploreStepId,
} from '../../utils/demoExploreStorage'
import { celebrateQuestStepUnlock } from '../../utils/questCelebration'
import { DEMO_UNLOCK_COPY } from './demoUnlockCopy'
import { DemoProgressHistory } from './DemoProgressHistory'
import {
  DEMO_HERO_COLORS,
  demoBadgeChipSx,
  demoCtaOutlinedSx,
  demoHudSurfaceSx,
  demoProgressBarSx,
  demoStepBulletSx,
  demoStepRowSx,
} from './demoTheme'
import { GA_EVENTS, trackActivationEvent } from '../../config/analyticsEvents'
import { DemoQuestCompleteDialog } from './DemoQuestCompleteDialog'

const STEPS: Array<{ id: DemoExploreStepId; label: string; to: string; match: RegExp }> = [
  { id: 'see-invoice', label: 'Consulter une facture', to: '/factures/inbox', match: /^\/factures\/voir\// },
  { id: 'see-quote', label: 'Consulter un devis', to: '/devis/inbox', match: /^\/devis\/voir\// },
  {
    id: 'see-efacture',
    label: 'Voir le score conformité',
    to: '/parametres/facturation-electronique',
    match: /^\/parametres\/facturation-electronique/,
  },
]

/**
 * Checklist de progression sur l'espace démo (dashboard).
 */
export function DemoExploreChecklist() {
  const location = useLocation()
  const toast = useToast()
  const [tick, setTick] = useState(0)
  const [recapOpen, setRecapOpen] = useState(false)
  const [celebrateStep, setCelebrateStep] = useState<DemoExploreStepId | null>(null)
  const completionTracked = useRef(false)
  const isDemo = demoService.isDemoSession()
  const { done, total } = demoExploreProgress()
  const allDone = isDemo && done >= total

  useEffect(() => {
    if (!isDemo) return
    for (const step of STEPS) {
      if (step.match.test(location.pathname) && !isDemoExploreStepDone(step.id)) {
        markDemoExploreStep(step.id)
        setTick((n) => n + 1)
        setCelebrateStep(step.id)
        celebrateQuestStepUnlock(toast, {
          title: DEMO_UNLOCK_COPY[step.id].title,
          message: DEMO_UNLOCK_COPY[step.id].message,
          nextAction: DEMO_UNLOCK_COPY[step.id].nextAction,
        })
        window.setTimeout(() => setCelebrateStep(null), 500)
      }
    }
  }, [isDemo, location.pathname, toast])

  useEffect(() => {
    if (!allDone || completionTracked.current) return
    completionTracked.current = true
    trackActivationEvent(GA_EVENTS.DEMO_QUEST_COMPLETED, { quest_count: total })
    if (!hasSeenDemoQuestRecap()) {
      setRecapOpen(true)
    }
  }, [allDone, total])

  if (!isDemo) return null

  if (allDone) {
    return (
      <>
        <DemoQuestCompleteDialog open={recapOpen} onClose={() => setRecapOpen(false)} />
        {!recapOpen && hasSeenDemoQuestRecap() && <DemoProgressHistory compact />}
      </>
    )
  }

  void tick

  const progressPct = (done / total) * 100
  const remaining = total - done
  const progressHint =
    remaining === total
      ? 'En 2 minutes : facture conforme, devis signé, score 2026 — sans créer de compte.'
      : remaining === 1
        ? 'Dernière étape : savoir si vous êtes prêt avant septembre 2026.'
        : `Plus que ${remaining} étapes pour voir tout votre flux commercial + conformité PA.`

  return (
    <Card variant="outlined" sx={{ mb: 2, ...demoHudSurfaceSx('light') }}>
      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
        <Stack spacing={1.5}>
          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <EmojiEventsIcon sx={{ color: DEMO_HERO_COLORS.main, fontSize: 22 }} />
                <Typography variant="subtitle1" fontWeight={800} sx={{ color: DEMO_HERO_COLORS.ink }}>
                  Quêtes démo
                </Typography>
              </Stack>
              <Chip label={`${done}/${total}`} size="small" sx={demoBadgeChipSx()} />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {progressHint}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progressPct}
              sx={{ mt: 1.25, ...demoProgressBarSx() }}
            />
          </Box>
          <Stack spacing={0.75}>
            {STEPS.map((step, index) => {
              const completed = isDemoExploreStepDone(step.id)
              const isNext =
                !completed && STEPS.slice(0, index).every((s) => isDemoExploreStepDone(s.id))
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
                    ...demoStepRowSx(isNext || celebrating, completed),
                  }}
                >
                  <Box sx={demoStepBulletSx(completed, isNext || celebrating)}>
                    {completed ? <CheckCircleOutlineIcon sx={{ fontSize: 16 }} /> : index + 1}
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: completed ? 500 : isNext ? 700 : 600,
                      color: completed ? 'text.secondary' : DEMO_HERO_COLORS.ink,
                      textDecoration: completed ? 'line-through' : 'none',
                    }}
                  >
                    {step.label}
                  </Typography>
                </Stack>
              )
            })}
          </Stack>
          {done > 0 && <DemoProgressHistory />}
          <Button
            component={RouterLink}
            to="/signup?from=demo"
            size="small"
            variant="outlined"
            sx={demoCtaOutlinedSx()}
          >
            Passer à mon compte gratuit
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}
