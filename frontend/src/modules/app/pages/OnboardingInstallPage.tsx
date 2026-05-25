import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../stores/authStore'
import {
  Box,
  Button,
  LinearProgress,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip,
  Stack,
} from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { TechStackPicker } from '../../../components/catalog/TechStackPicker'
import { OnboardingLayout } from '../../onboarding/OnboardingLayout'
import { OnboardingDevWelcomeStep } from '../../onboarding/steps/OnboardingDevWelcomeStep'
import { OnboardingDevProfileStep } from '../../onboarding/steps/OnboardingDevProfileStep'
import {
  onboardingService,
  type OnboardingPreviewProduct,
} from '../../../services/onboardingService'
import { usePageTitle } from '../../../hooks/usePageTitle'

const INSTALL_STEPS = [
  'Analyse de votre stack…',
  'Sélection des prestations adaptées…',
  'Création de votre catalogue et de vos tarifs…',
  'Finalisation…',
] as const

const WIZARD_STEPS = ['Bienvenue', 'Profil', 'Stack', 'Validation', 'Installation'] as const

const STEP_TITLES: Record<number, { title: string; subtitle?: string }> = {
  0: {
    title: 'Bienvenue, développeur·se',
    subtitle: 'Facturio n’est pas un logiciel générique : il est conçu pour facturer des prestations techniques.',
  },
  1: {
    title: 'Votre profil',
    subtitle: 'Dites-nous qui vous êtes — ensuite on cible votre stack.',
  },
  2: {
    title: 'Votre stack technique',
    subtitle: 'Sélectionnez les langages, frameworks et outils que vous utilisez.',
  },
  3: {
    title: 'Valider votre catalogue',
    subtitle: 'Aperçu des prestations qui seront installées sur votre compte.',
  },
  4: {
    title: 'Installation en cours',
    subtitle: 'Nous préparons vos produits et tarifs par défaut.',
  },
}

function formatPrice(value: string | number | null | undefined): string {
  if (value == null) return '—'
  const n = typeof value === 'string' ? parseFloat(value) : value
  if (Number.isNaN(n)) return '—'
  return `${n.toFixed(0)} € HT`
}

export function OnboardingInstallPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [wizardStep, setWizardStep] = useState(0)
  const [devProfile, setDevProfile] = useState<string | null>(null)
  const [technologyIds, setTechnologyIds] = useState<string[]>([])
  const [techError, setTechError] = useState<string | null>(null)
  const [preview, setPreview] = useState<OnboardingPreviewProduct[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [installing, setInstalling] = useState(false)
  const [installStepIndex, setInstallStepIndex] = useState(0)
  const [installProgress, setInstallProgress] = useState(0)

  useEffect(() => {
    onboardingService.getStatus().then((s) => {
      if (s.completed) {
        if (user?.emailVerified !== true) {
          navigate('/inscription/confirmation', {
            replace: true,
            state: { email: user?.email ?? '', onboardingDone: true },
          })
        } else {
          navigate('/dashboard', { replace: true })
        }
      }
    }).catch(() => {})
  }, [navigate])

  const canValidate = technologyIds.length >= 2
  const meta = STEP_TITLES[wizardStep] ?? STEP_TITLES[0]

  usePageTitle(`Assistant — ${WIZARD_STEPS[wizardStep] ?? 'Configuration'}`)

  const handlePreview = async () => {
    if (!canValidate) {
      setTechError('Choisissez au moins 2 technologies')
      return
    }
    setTechError(null)
    setError(null)
    setPreviewLoading(true)
    try {
      const res = await onboardingService.preview(technologyIds)
      setPreview(res.products)
      setWizardStep(3)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la prévisualisation')
    } finally {
      setPreviewLoading(false)
    }
  }

  const runInstallAnimation = async (realInstall: () => Promise<number>) => {
    setWizardStep(4)
    setInstalling(true)
    setInstallStepIndex(0)
    setInstallProgress(8)

    const stepTimer = window.setInterval(() => {
      setInstallStepIndex((i) => Math.min(i + 1, INSTALL_STEPS.length - 1))
      setInstallProgress((p) => Math.min(p + 22, 88))
    }, 700)

    try {
      const count = await realInstall()
      setInstallProgress(100)
      window.clearInterval(stepTimer)
      await new Promise((r) => setTimeout(r, 600))
      if (user?.emailVerified !== true) {
        navigate('/inscription/confirmation', {
          replace: true,
          state: { email: user?.email ?? '', onboardingDone: true, productCount: count },
        })
      } else {
        navigate('/dashboard', { replace: true, state: { onboardingDone: true, productCount: count } })
      }
    } catch (e: unknown) {
      window.clearInterval(stepTimer)
      setInstalling(false)
      setWizardStep(3)
      setError(e instanceof Error ? e.message : 'Installation impossible')
    }
  }

  const handleInstall = () => {
    void runInstallAnimation(async () => {
      const res = await onboardingService.install(technologyIds)
      return res.clonedCount
    })
  }

  const installLabel = useMemo(
    () => INSTALL_STEPS[Math.min(installStepIndex, INSTALL_STEPS.length - 1)],
    [installStepIndex],
  )

  return (
    <OnboardingLayout
      activeStep={wizardStep}
      steps={WIZARD_STEPS}
      title={meta.title}
      subtitle={meta.subtitle}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {wizardStep === 0 && <OnboardingDevWelcomeStep onNext={() => setWizardStep(1)} />}

      {wizardStep === 1 && (
        <OnboardingDevProfileStep
          selected={devProfile}
          onSelect={setDevProfile}
          onBack={() => setWizardStep(0)}
          onNext={() => setWizardStep(2)}
        />
      )}

      {wizardStep === 2 && (
        <Box>
          <TechStackPicker
            value={technologyIds}
            onChange={(ids) => {
              setTechnologyIds(ids)
              if (ids.length >= 2) setTechError(null)
            }}
            error={techError}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
            <Button variant="outlined" onClick={() => setWizardStep(1)} sx={{ flex: 1 }}>
              Retour
            </Button>
            <Button
              variant="contained"
              size="large"
              sx={{ flex: 2 }}
              disabled={!canValidate || previewLoading}
              onClick={() => void handlePreview()}
            >
              {previewLoading ? 'Préparation…' : 'Voir mon catalogue'}
            </Button>
          </Stack>
        </Box>
      )}

      {wizardStep === 3 && (
        <Box>
          <Alert severity="info" sx={{ mb: 2 }}>
            {preview.length} prestation(s) seront copiées sur votre compte. Vous pourrez ajuster les prix et les
            descriptions dans Produits.
          </Alert>
          <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
            {technologyIds.map((id) => (
              <Chip key={id} label={id} size="small" color="primary" variant="outlined" />
            ))}
          </Stack>
          <List dense sx={{ maxHeight: 320, overflow: 'auto', bgcolor: 'action.hover', borderRadius: 1, mb: 2 }}>
            {preview.map((p) => (
              <ListItem key={p.id} divider>
                <ListItemText
                  primary={p.name}
                  secondary={`${p.sku ?? '—'} · ${formatPrice(p.unitPrice)}`}
                />
              </ListItem>
            ))}
          </List>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button variant="outlined" onClick={() => setWizardStep(2)} disabled={installing}>
              Modifier la stack
            </Button>
            <Button variant="contained" size="large" onClick={handleInstall} disabled={installing}>
              Lancer l&apos;installation
            </Button>
          </Stack>
        </Box>
      )}

      {wizardStep === 4 && (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <CheckCircleOutlineIcon color="primary" sx={{ fontSize: 48, mb: 1, opacity: installing ? 0.3 : 1 }} />
          <Typography variant="h6" sx={{ mb: 2 }}>
            {installLabel}
          </Typography>
          <LinearProgress variant="determinate" value={installProgress} sx={{ mb: 2, height: 8, borderRadius: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Votre espace développeur est en cours de préparation…
          </Typography>
        </Box>
      )}
    </OnboardingLayout>
  )
}
