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
        // Accueil public : redirection uniquement si l’email est déjà confirmé
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
        badge="Devis · Factures · Comptabilité"
        title={SITE_TAGLINE}
        subtitle={SITE_DESCRIPTION}
        primaryCta={{ label: 'Commencer gratuitement', to: '/signup' }}
        secondaryCta={{ label: 'Découvrir les fonctionnalités', to: '/fonctionnalites' }}
        visual={<HeroDashboardMock />}
      />

      <StatsBar />

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
                  Conformité 2026
                </Typography>
                <Typography variant="h3" fontWeight={800} sx={{ mt: 1, mb: 2, fontSize: { xs: '1.75rem', md: '2.25rem' } }}>
                  Anticipez la facturation électronique obligatoire
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.75 }}>
                  Dès le <strong>{REFORM_DATES.reception}</strong>, vos factures B2B devront transiter par
                  le réseau officiel (Plateforme Agréée). Facturio vous aide à vérifier vos données et à
                  générer du Factur-X avant l’envoi PA.
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                  <Button
                    component={RouterLink}
                    to="/signup"
                    variant="contained"
                    endIcon={<ArrowForwardIcon />}
                  >
                    Créer un compte
                  </Button>
                  <Button component={RouterLink} to="/tarifs" variant="outlined">
                    Voir les paliers
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
                      Exemple de score de préparation
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
                      SIRET émetteur · SIREN client · lignes · mentions — visible dans l’app sur chaque
                      facture.
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
            Ce que Facturio fait pour la réforme
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
                Conçu pour votre métier
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, maxWidth: 600, mx: 'auto' }}>
                Un outil vertical pour facturer dev web, logiciel, automatisation et maintenance — pas une
                compta généraliste.
              </Typography>
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
        title="L'essentiel pour facturer vos missions"
        subtitle="Du devis à l'encaissement, avec une couche conformité 2026 intégrée."
        features={FEATURES}
      />

      <Box sx={{ bgcolor: (t) => alpha(t.palette.primary.main, 0.04), py: { xs: 6, md: 8 } }}>
        <Container maxWidth="lg">
          <ScrollReveal>
            <Typography variant="h2" align="center" sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' }, fontWeight: 700, mb: 1 }}>
              Calendrier réforme 2026–2027
            </Typography>
          </ScrollReveal>
          <ReformTimeline />
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button component={RouterLink} to="/facturation-electronique" variant="contained" endIcon={<ArrowForwardIcon />}>
              Feuille de route détaillée
            </Button>
          </Box>
        </Container>
      </Box>

      <PricingSection />
      <CtaSection
        title="Facturez vos missions sans tableur"
        subtitle="Créez votre compte, importez votre catalogue de prestations et émettez votre premier devis en quelques minutes."
        primaryLabel="Commencer gratuitement"
        primaryTo="/signup"
        secondaryLabel="Comparer les offres"
        secondaryTo="/tarifs"
      />
    </Box>
  )
}
