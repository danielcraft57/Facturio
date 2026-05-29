import { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
  alpha,
  LinearProgress,
} from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import { useAuthStore } from '../../../stores/authStore'
import { authService } from '../../../services/authService'
import { MarketingHero } from '../components/MarketingHero'
import { HeroDashboardMock } from '../components/HeroDashboardMock'
import { FeatureGrid } from '../components/FeatureGrid'
import { PricingSection } from '../components/PricingCards'
import { CtaSection } from '../components/CtaSection'
import { ReformTimeline } from '../components/ReformTimeline'
import { StatsBar } from '../components/StatsBar'
import { ScrollReveal } from '../components/ScrollReveal'
import { MarketingImage } from '../components/MarketingImage'
import { EfactureRoadmapAlert } from '../components/EfactureRoadmapAlert'
import {
  SITE_TAGLINE,
  SITE_DESCRIPTION,
  REFORM_DATES,
  REFORM_HIGHLIGHTS,
  VERTICAL_SEGMENTS,
  FEATURES,
  VALUE_PROPOSITIONS,
  CTA,
} from '../constants/siteContent'

export function LandingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const accessMessage = (location.state as { message?: string } | null)?.message
  const checkAuth = useAuthStore((s) => s.checkAuth)
  const [resolvingSession, setResolvingSession] = useState(() => authService.hasSessionToken())

  useEffect(() => {
    if (!authService.hasSessionToken()) {
      setResolvingSession(false)
      return
    }
    let cancelled = false
    void (async () => {
      try {
        await checkAuth()
        const user = useAuthStore.getState().user
        if (cancelled) return
        if (user?.emailVerified === true) {
          navigate('/dashboard', { replace: true })
          return
        }
      } catch {
        authService.clearLocalSession()
        useAuthStore.setState({ user: null, isAuthenticated: false })
      }
      if (!cancelled) setResolvingSession(false)
    })()
    return () => {
      cancelled = true
    }
  }, [checkAuth, navigate])

  if (resolvingSession) return null

  return (
    <Box>
      {accessMessage && (
        <Container maxWidth="lg" sx={{ pt: 2 }}>
          <Alert severity="warning">{accessMessage}</Alert>
        </Container>
      )}

      <MarketingHero
        badge="Réforme sept. 2026 · Devis · Factures · Pré-compta"
        title={SITE_TAGLINE}
        subtitle={SITE_DESCRIPTION}
        primaryCta={CTA.signupFree}
        secondaryCta={CTA.efacture2026}
        visual={<HeroDashboardMock />}
      />

      <StatsBar />

      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 6 } }}>
        <Grid container spacing={2}>
          {VALUE_PROPOSITIONS.map((item, i) => (
            <Grid key={item.title} size={{ xs: 12, md: 4 }}>
              <ScrollReveal delayMs={i * 50}>
                <Card variant="outlined" sx={{ height: '100%', borderRadius: 3, textAlign: 'center' }}>
                  <CardContent>
                    <RocketLaunchIcon color="primary" sx={{ mb: 1 }} />
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.description}
                    </Typography>
                  </CardContent>
                </Card>
              </ScrollReveal>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Box
        sx={{
          bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
          borderBlock: 1,
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <ScrollReveal>
                <Typography
                  variant="overline"
                  color="primary"
                  fontWeight={700}
                  sx={{ letterSpacing: 1.2 }}
                >
                  Levier n°1 — Conformité 2026
                </Typography>
                <Typography variant="h3" fontWeight={800} sx={{ mt: 1, mb: 2, fontSize: { xs: '1.75rem', md: '2.25rem' } }}>
                  Réception obligatoire dès le {REFORM_DATES.reception}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.75 }}>
                  Même si vous n’émettez qu’en 2027, vous devez <strong>recevoir</strong> des factures
                  électroniques B2B via une Plateforme Agréée. Facturio vérifie vos données, génère du
                  Factur-X et réserve le connecteur PA sur le palier dédié.
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                  <Button
                    component={RouterLink}
                    to={CTA.reserveEfacture.to}
                    variant="contained"
                    color="warning"
                    endIcon={<ArrowForwardIcon />}
                  >
                    {CTA.reserveEfacture.label}
                  </Button>
                  <Button component={RouterLink} to={CTA.efacture2026.to} variant="outlined">
                    Comprendre la réforme
                  </Button>
                </Box>
              </ScrollReveal>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ScrollReveal delayMs={80}>
                <EfactureRoadmapAlert />
                <Card variant="outlined" sx={{ mt: 2, borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      Score de préparation (exemple)
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={85}
                        sx={{ flex: 1, height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="body2" fontWeight={700}>
                        85 %
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      SIRET · SIREN client · lignes · mentions — visible sur chaque facture dans l’app.
                    </Typography>
                  </CardContent>
                </Card>
              </ScrollReveal>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        <ScrollReveal>
          <Typography variant="h2" align="center" sx={{ fontWeight: 700, mb: 4, fontSize: { xs: '1.5rem', md: '2rem' } }}>
            Préparez la réforme sans quitter Facturio
          </Typography>
        </ScrollReveal>
        <Grid container spacing={3}>
          {REFORM_HIGHLIGHTS.map((item, i) => (
            <Grid key={item.title} size={{ xs: 12, md: 4 }}>
              <ScrollReveal delayMs={i * 60}>
                <Card variant="outlined" sx={{ height: '100%', borderRadius: 3 }}>
                  <CardContent>
                    <VerifiedUserIcon color="primary" sx={{ mb: 1 }} />
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.description}
                    </Typography>
                  </CardContent>
                </Card>
              </ScrollReveal>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <ScrollReveal>
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              <Typography variant="h2" sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' }, fontWeight: 700, mb: 1.5 }}>
                Levier n°2 — Pensé pour votre métier
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, maxWidth: 640, mx: 'auto' }}>
                Indy ou Pennylane couvrent la compta générale. Facturio couvre{' '}
                <strong>comment vous facturez</strong> : forfaits, régie, maintenance et packs IA.
              </Typography>
              <Button
                component={RouterLink}
                to={CTA.prestations.to}
                sx={{ mt: 2 }}
                endIcon={<ArrowForwardIcon />}
              >
                {CTA.prestations.label}
              </Button>
            </Box>
          </ScrollReveal>
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, lg: 6 }}>
              <ScrollReveal delayMs={100}>
                <MarketingImage src="/images/facturio-prestations.png" alt="Catalogue de prestations" float />
              </ScrollReveal>
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Grid container spacing={2}>
                {VERTICAL_SEGMENTS.map((seg, i) => (
                  <Grid key={seg.title} size={{ xs: 12, sm: 6 }}>
                    <ScrollReveal delayMs={80 * i}>
                      <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
                        <CardContent>
                          <Typography variant="h6" fontWeight={600} gutterBottom>
                            {seg.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {seg.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    </ScrollReveal>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <FeatureGrid
        title="Du devis à l'encaissement"
        subtitle="Cycle commercial complet avec conformité 2026 intégrée — pas une usine à gaz comptable."
        features={FEATURES}
      />

      <Box sx={{ bgcolor: (t) => alpha(t.palette.primary.main, 0.04), py: { xs: 6, md: 8 } }}>
        <Container maxWidth="lg">
          <ScrollReveal>
            <Typography variant="h2" align="center" sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' }, fontWeight: 700, mb: 1 }}>
              Calendrier réforme 2026–2027
            </Typography>
            <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3, maxWidth: 520, mx: 'auto' }}>
              Micro-entreprise : émission en 2027 — mais réception dès 2026. Anticipez maintenant.
            </Typography>
          </ScrollReveal>
          <ReformTimeline />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2, mt: 4 }}>
            <Button
              component={RouterLink}
              to={CTA.efacture2026.to}
              variant="contained"
              endIcon={<ArrowForwardIcon />}
            >
              Feuille de route détaillée
            </Button>
            <Button component={RouterLink} to={CTA.signupFree.to} variant="outlined">
              {CTA.signupFree.label}
            </Button>
          </Box>
        </Container>
      </Box>

      <PricingSection />
      <CtaSection
        title="Votre premier devis en 10 minutes"
        subtitle="Compte gratuit, catalogue seed inclus. Passez Pro quand vous dépassez 10 factures/mois ou activez la prospection."
        primaryLabel={CTA.signupFree.label}
        primaryTo={CTA.signupFree.to}
        secondaryLabel={CTA.pricing.label}
        secondaryTo={CTA.pricing.to}
      />
    </Box>
  )
}
