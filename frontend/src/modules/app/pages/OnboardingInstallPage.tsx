import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../../stores/authStore'
import {
  Box,
  Button,
  CircularProgress,
  LinearProgress,
  Typography,
  Alert,
  Chip,
  Stack,
} from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { TechStackPicker } from '../../../components/catalog/TechStackPicker'
import { OnboardingLayout } from '../../onboarding/OnboardingLayout'
import { OnboardingDevWelcomeStep } from '../../onboarding/steps/OnboardingDevWelcomeStep'
import { OnboardingDevProfileStep } from '../../onboarding/steps/OnboardingDevProfileStep'
import { OnboardingCatalogPreviewStep } from '../../onboarding/steps/OnboardingCatalogPreviewStep'
import { usePageTitle } from '../../../hooks/usePageTitle'
import {
  filterSuggestedTechIds,
  normalizeOnboardingProfileId,
  resolveOnboardingProfile,
} from '../../onboarding/onboardingProfiles'
import {
  onboardingService,
  type OnboardingPreviewProduct,
} from '../../../services/onboardingService'
import { catalogService, type CatalogPack, type TechStackChoices } from '../../../services/catalogService'
import { dispatchOnboardingInstalledEvent } from '../../../utils/lifecycleNotifications'
import { useToast } from '../../../components/useToast'
import { GA_EVENTS, trackActivationEvent } from '../../../config/analyticsEvents'

const INSTALL_STEPS = [
  'Analyse de votre stack…',
  'Sélection des prestations adaptées…',
  'Création de votre catalogue et de vos tarifs…',
  'Finalisation…',
] as const

const WIZARD_STEPS = ['Bienvenue', 'Profil', 'Stack', 'Validation', 'Installation'] as const

const STEP_TITLES: Record<number, { title: string; subtitle?: string }> = {
  0: {
    title: 'Bienvenue sur PrestaFacture',
    subtitle: 'Facturation pensée pour les prestations web : dev, design, commercial, communication.',
  },
  1: {
    title: 'Votre profil',
    subtitle: 'Métier et posture — on adapte les technos et le catalogue à votre pratique.',
  },
  2: {
    title: 'Votre stack technique',
    subtitle: 'Sélectionnez les langages, frameworks et outils que vous utilisez.',
  },
  3: {
    title: 'Valider votre catalogue',
    subtitle: 'Choisissez les prestations à installer — score et raisons de matching affichés.',
  },
  4: {
    title: 'Installation en cours',
    subtitle: 'Nous préparons vos produits et tarifs par défaut.',
  },
}

function resolveReturnPath(raw: string | null, replayMode: boolean): string {
  if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw
  return replayMode ? '/produits' : '/dashboard'
}

export function OnboardingInstallPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const [initializing, setInitializing] = useState(true)
  const [replayMode, setReplayMode] = useState(false)
  const [existingProductCount, setExistingProductCount] = useState(0)
  const [returnTo, setReturnTo] = useState('/dashboard')
  const [wizardStep, setWizardStep] = useState(0)
  const [devProfile, setDevProfile] = useState<string | null>(null)
  const [technologyIds, setTechnologyIds] = useState<string[]>([])
  const [techError, setTechError] = useState<string | null>(null)
  const [preview, setPreview] = useState<OnboardingPreviewProduct[]>([])
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([])
  const [techChoices, setTechChoices] = useState<TechStackChoices | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [installing, setInstalling] = useState(false)
  const [installStepIndex, setInstallStepIndex] = useState(0)
  const [installProgress, setInstallProgress] = useState(0)
  const [catalogPacks, setCatalogPacks] = useState<CatalogPack[]>([])
  const [selectedPackIds, setSelectedPackIds] = useState<string[]>([])
  const packsSuggestedRef = useRef(false)
  const [skipping, setSkipping] = useState(false)
  const toast = useToast()

  useEffect(() => {
    void catalogService.listPacks().then(setCatalogPacks).catch(() => {})
    void catalogService.getTechChoices().then(setTechChoices).catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    onboardingService
      .getStatus()
      .then((s) => {
        if (cancelled) return
        const replay = s.completed
        setReplayMode(replay)
        setExistingProductCount(s.productCount)
        setReturnTo(resolveReturnPath(searchParams.get('returnTo'), replay))
        if (s.devProfile) setDevProfile(normalizeOnboardingProfileId(s.devProfile))
        if (replay) {
          if (s.preferredTechnologies.length >= 2) {
            setTechnologyIds(s.preferredTechnologies)
            setWizardStep(2)
          } else {
            setWizardStep(1)
          }
        }
      })
      .catch(() => {
        if (!cancelled) setReturnTo(resolveReturnPath(searchParams.get('returnTo'), false))
      })
      .finally(() => {
        if (!cancelled) setInitializing(false)
      })
    return () => {
      cancelled = true
    }
  }, [searchParams])

  const applyProfileToStack = (profileId: string) => {
    void catalogService.getTechChoices().then((choices) => {
      const profile = resolveOnboardingProfile(profileId)
      const allowedCats = new Set(profile?.techCategories ?? choices.categories.map((c) => c.id))
      const validIds = new Set(
        choices.categories
          .filter((c) => allowedCats.has(c.id))
          .flatMap((c) => c.options.map((o) => o.id)),
      )
      const suggested = filterSuggestedTechIds(profileId, validIds)
      const kept = technologyIds.filter((id) => validIds.has(id))
      const merged = [...new Set([...suggested, ...kept])].slice(0, choices.maxTotalSelect)
      setTechnologyIds(
        merged.length >= choices.minTotalSelect
          ? merged
          : suggested.length
            ? suggested.slice(0, choices.maxTotalSelect)
            : kept,
      )
    })
  }

  const handleProfileSelect = (profileId: string) => {
    setDevProfile(profileId)
    packsSuggestedRef.current = false
    setSelectedPackIds([])
    applyProfileToStack(profileId)
  }

  const visiblePacks = useMemo(() => {
    if (!devProfile) return catalogPacks
    return catalogPacks.filter(
      (pack) =>
        !pack.suggestedProfiles?.length || pack.suggestedProfiles.includes(devProfile),
    )
  }, [catalogPacks, devProfile])

  useEffect(() => {
    if (wizardStep !== 3 || !devProfile || packsSuggestedRef.current) return
    const suggested = visiblePacks
      .filter((pack) => pack.suggestedProfiles?.includes(devProfile))
      .map((pack) => pack.id)
    if (suggested.length) {
      setSelectedPackIds(suggested)
      packsSuggestedRef.current = true
    }
  }, [wizardStep, devProfile, visiblePacks])

  const technologyLabels = useMemo(() => {
    if (!techChoices) return technologyIds
    const byId = new Map(
      techChoices.categories.flatMap((c) => c.options.map((o) => [o.id, o.label] as const)),
    )
    return technologyIds.map((id) => byId.get(id) ?? id)
  }, [techChoices, technologyIds])

  const canValidate = technologyIds.length >= 2
  const meta = STEP_TITLES[wizardStep] ?? STEP_TITLES[0]

  usePageTitle(`Assistant — ${WIZARD_STEPS[wizardStep] ?? 'Configuration'}`)

  const advanceWizardStep = (next: number, victoryMessage?: string) => {
    setWizardStep(next)
    if (victoryMessage) {
      toast.success(victoryMessage, { duration: 4000 })
    }
  }

  const handleSkipOnboarding = async () => {
    if (replayMode || skipping) return
    setSkipping(true)
    setError(null)
    try {
      const res = await onboardingService.skip()
      trackActivationEvent(GA_EVENTS.ONBOARDING_SKIPPED)
      const destination =
        user?.emailVerified !== true ? '/inscription/confirmation' : returnTo
      const navState =
        destination === '/inscription/confirmation'
          ? { email: user?.email ?? '', onboardingDone: true, skippedCatalog: true }
          : { onboardingDone: true, skippedCatalog: true, message: res.message }
      navigate(destination, { replace: true, state: navState })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Impossible de passer cette étape')
      setSkipping(false)
    }
  }

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
      setSelectedProductIds(res.products.filter((p) => p.suggested).map((p) => p.id))
      advanceWizardStep(3, `${res.products.length} prestation(s) trouvée(s) pour votre stack.`)
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
      setInstalling(false)
      dispatchOnboardingInstalledEvent(count)
      const destination =
        !replayMode && user?.emailVerified !== true
          ? '/inscription/confirmation'
          : returnTo
      const navState =
        destination === '/inscription/confirmation'
          ? { email: user?.email ?? '', onboardingDone: true, productCount: count }
          : {
              catalogRegenerated: replayMode,
              onboardingDone: !replayMode,
              productCount: count,
            }
      navigate(destination, { replace: true, state: navState })
    } catch (e: unknown) {
      window.clearInterval(stepTimer)
      setInstalling(false)
      setWizardStep(3)
      setError(e instanceof Error ? e.message : 'Installation impossible')
    }
  }

  const togglePack = (packId: string) => {
    setSelectedPackIds((ids) =>
      ids.includes(packId) ? ids.filter((id) => id !== packId) : [...ids, packId],
    )
  }

  const toggleProduct = (id: number) => {
    setSelectedProductIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    )
  }

  const selectAllProducts = () => setSelectedProductIds(preview.map((p) => p.id))
  const selectSuggestedProducts = () =>
    setSelectedProductIds(preview.filter((p) => p.suggested).map((p) => p.id))
  const clearProductSelection = () => setSelectedProductIds([])

  const handleInstall = () => {
    if (selectedProductIds.length === 0) return
    void runInstallAnimation(async () => {
      const res = await onboardingService.install(
        technologyIds,
        devProfile,
        selectedProductIds,
      )
      let extra = 0
      for (const packId of selectedPackIds) {
        try {
          const installed = await catalogService.installPack(packId)
          extra += installed.clonedCount
        } catch {
          /* pack optionnel — ne bloque pas l'onboarding */
        }
      }
      return res.clonedCount + extra
    })
  }

  const installLabel = useMemo(
    () => INSTALL_STEPS[Math.min(installStepIndex, INSTALL_STEPS.length - 1)],
    [installStepIndex],
  )

  if (initializing) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  const layoutTitle = replayMode && wizardStep >= 2 ? 'Régénérer votre catalogue' : meta.title
  const layoutSubtitle =
    replayMode && wizardStep >= 2
      ? 'Modifiez votre stack : les produits actuels seront remplacés par une nouvelle sélection.'
      : meta.subtitle

  return (
    <OnboardingLayout
      activeStep={wizardStep}
      steps={WIZARD_STEPS}
      title={layoutTitle}
      subtitle={layoutSubtitle}
      profileId={devProfile}
    >
      {replayMode && wizardStep < 4 && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => navigate(returnTo)}>
              Annuler
            </Button>
          }
        >
          {existingProductCount > 0
            ? `Réinstallation : vos ${existingProductCount} produit(s) actuel(s) seront remplacés.`
            : 'Réinstallation du catalogue à partir de votre stack technique.'}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {wizardStep === 0 && (
        <OnboardingDevWelcomeStep
          onNext={() => advanceWizardStep(1)}
          onSkip={!replayMode ? () => void handleSkipOnboarding() : undefined}
          skipping={skipping}
        />
      )}

      {wizardStep === 1 && (
        <OnboardingDevProfileStep
          selected={devProfile}
          onSelect={handleProfileSelect}
          onBack={() => setWizardStep(0)}
          onNext={() => advanceWizardStep(2, 'Profil enregistré — on adapte technos et catalogue.')}
        />
      )}

      {wizardStep === 2 && (
        <Box>
          <TechStackPicker
            value={technologyIds}
            profileId={devProfile}
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
        <OnboardingCatalogPreviewStep
          products={preview}
          selectedIds={selectedProductIds}
          technologyLabels={technologyLabels}
          replayMode={replayMode}
          installing={installing}
          onToggle={toggleProduct}
          onSelectAll={selectAllProducts}
          onSelectSuggested={selectSuggestedProducts}
          onClear={clearProductSelection}
          onBack={() => setWizardStep(2)}
          onInstall={handleInstall}
          visiblePacks={
            visiblePacks.length > 0 ? (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Packs optionnels{devProfile ? ' adaptés à votre profil' : ''} (en plus de la stack)
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {visiblePacks.map((pack) => (
                    <Chip
                      key={pack.id}
                      label={`${pack.name} · ${pack.priceHint} €`}
                      onClick={() => togglePack(pack.id)}
                      color={selectedPackIds.includes(pack.id) ? 'primary' : 'default'}
                      variant={selectedPackIds.includes(pack.id) ? 'filled' : 'outlined'}
                    />
                  ))}
                </Stack>
              </Box>
            ) : null
          }
        />
      )}

      {wizardStep === 4 && (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <CheckCircleOutlineIcon color="primary" sx={{ fontSize: 48, mb: 1, opacity: installing ? 0.3 : 1 }} />
          <Typography variant="h6" sx={{ mb: 2 }}>
            {installLabel}
          </Typography>
          <LinearProgress variant="determinate" value={installProgress} sx={{ mb: 2, height: 8, borderRadius: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Votre catalogue est en cours de préparation…
          </Typography>
        </Box>
      )}
    </OnboardingLayout>
  )
}
