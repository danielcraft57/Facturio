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
  alpha,
  useTheme,
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
import { DEMO_HERO_COLORS, DEMO_HERO_GRADIENT, demoHudSurfaceSx } from './demoTheme'
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
  const theme = useTheme()
  const location = useLocation()
  const toast = useToast()
  const [tick, setTick] = useState(0)
  const [recapOpen, setRecapOpen] = useState(false)
  const completionToastShown = useRef(false)
  const recapTracked = useRef(false)
  const isDemo = demoService.isDemoSession()
  const { done, total } = demoExploreProgress()
  const allDone = isDemo && done >= total

  useEffect(() => {
    if (!isDemo) return
    for (const step of STEPS) {
      if (step.match.test(location.pathname) && !isDemoExploreStepDone(step.id)) {
        markDemoExploreStep(step.id)
        setTick((n) => n + 1)
        toast.success(`Étape validée : ${step.label}`, {
          title: 'Parcours démo',
          duration: 5000,
        })
      }
    }
  }, [isDemo, location.pathname, toast])

  useEffect(() => {
    if (!allDone || completionToastShown.current) return
    completionToastShown.current = true
    if (!recapTracked.current) {
      recapTracked.current = true
      trackActivationEvent(GA_EVENTS.DEMO_QUEST_COMPLETED, { quest_count: total })
    }
    if (!hasSeenDemoQuestRecap()) {
      setRecapOpen(true)
    }
    toast.success(
      'Vous avez vu l\'essentiel. Créez votre compte gratuit pour émettre vos propres factures.',
      {
        title: 'Parcours démo terminé',
        duration: 12000,
        action: (
          <Button component={RouterLink} to="/signup?from=demo" size="small" color="inherit">
            S&apos;inscrire
          </Button>
        ),
      },
    )
  }, [allDone, toast, total])

  if (!isDemo) return null

  if (allDone) {
    if (!recapOpen && hasSeenDemoQuestRecap()) return null
    return <DemoQuestCompleteDialog open={recapOpen} onClose={() => setRecapOpen(false)} />
  }

  void tick

  const progressPct = (done / total) * 100

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 2,
        ...demoHudSurfaceSx(theme.palette.mode),
      }}
    >
      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
        <Stack spacing={1.5}>
          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <EmojiEventsIcon sx={{ color: DEMO_HERO_COLORS.main, fontSize: 22 }} />
                <Typography variant="subtitle1" fontWeight={800}>
                  Quêtes démo
                </Typography>
              </Stack>
              <Chip
                label={`${done}/${total}`}
                size="small"
                sx={{
                  fontWeight: 800,
                  bgcolor: alpha(DEMO_HERO_COLORS.main, 0.12),
                  color: DEMO_HERO_COLORS.deep,
                }}
              />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Chaque étape montre une fonction clé — prochaine action en surbrillance.
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progressPct}
              sx={{
                mt: 1.25,
                height: 8,
                borderRadius: 4,
                bgcolor: alpha(DEMO_HERO_COLORS.main, 0.12),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  background: DEMO_HERO_GRADIENT,
                  boxShadow: `0 0 12px ${DEMO_HERO_COLORS.glow}`,
                },
              }}
            />
          </Box>
          <Stack spacing={0.75}>
            {STEPS.map((step, index) => {
              const completed = isDemoExploreStepDone(step.id)
              const isNext = !completed && STEPS.slice(0, index).every((s) => isDemoExploreStepDone(s.id))
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
                    borderRadius: 1.5,
                    px: 1,
                    py: 0.75,
                    border: '1px solid',
                    borderColor: isNext ? alpha(DEMO_HERO_COLORS.main, 0.45) : 'transparent',
                    bgcolor: isNext ? alpha(DEMO_HERO_COLORS.main, 0.08) : 'transparent',
                    boxShadow: isNext ? `0 0 16px ${alpha(DEMO_HERO_COLORS.main, 0.15)}` : 'none',
                    '&:hover': completed ? undefined : { bgcolor: alpha(DEMO_HERO_COLORS.main, 0.1) },
                  }}
                >
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      color: completed || isNext ? '#fff' : 'text.secondary',
                      background: completed || isNext ? DEMO_HERO_GRADIENT : alpha(theme.palette.text.primary, 0.08),
                    }}
                  >
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
          <Button
            component={RouterLink}
            to="/signup?from=demo"
            size="small"
            variant="outlined"
            sx={{
              alignSelf: 'flex-start',
              borderColor: alpha(DEMO_HERO_COLORS.main, 0.45),
              color: DEMO_HERO_COLORS.deep,
              fontWeight: 700,
            }}
          >
            Passer à mon compte gratuit
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}
