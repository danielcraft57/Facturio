import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Paper,
  Alert,
  keyframes,
} from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import PeopleIcon from '@mui/icons-material/People'
import AssessmentIcon from '@mui/icons-material/Assessment'
import SecurityIcon from '@mui/icons-material/Security'
import SpeedIcon from '@mui/icons-material/Speed'
import { useAuthStore } from '../../../stores/authStore'

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
`

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
`

const features = [
  {
    icon: <ReceiptLongIcon sx={{ fontSize: 40 }} />,
    title: 'Facturation simplifiée',
    description: 'Créez et gérez vos factures en quelques clics. Export PDF automatique.',
  },
  {
    icon: <PeopleIcon sx={{ fontSize: 40 }} />,
    title: 'Gestion clients',
    description: 'Centralisez toutes les informations de vos clients et prospects.',
  },
  {
    icon: <AssessmentIcon sx={{ fontSize: 40 }} />,
    title: 'Tableaux de bord',
    description: 'Suivez vos performances avec des graphiques et statistiques en temps réel.',
  },
  {
    icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
    title: 'Optimisation fiscale',
    description: 'Calculez et optimisez vos impôts avec nos outils dédiés.',
  },
  {
    icon: <SecurityIcon sx={{ fontSize: 40 }} />,
    title: 'Sécurité garantie',
    description: 'Vos données sont chiffrées et sauvegardées de manière sécurisée.',
  },
  {
    icon: <SpeedIcon sx={{ fontSize: 40 }} />,
    title: 'Rapide et intuitif',
    description: 'Interface moderne et réactive pour une productivité maximale.',
  },
]

/**
 * Page d'accueil publique (Landing) avec hero, visuels, animations et CTA.
 */
export function LandingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const accessMessage = (location.state as any)?.message
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const featuresRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
      return
    }
    setVisible(true)
  }, [navigate, isAuthenticated])

  useEffect(() => {
    const el = featuresRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setVisible(true)
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <Box>
      {accessMessage && (
        <Container maxWidth="lg" sx={{ pt: 2 }}>
          <Alert severity="warning" sx={{ mb: 2 }} onClose={() => {}}>
            {accessMessage}
          </Alert>
        </Container>
      )}

      {/* Hero */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 40%, #134e4a 100%)',
          color: 'white',
          py: { xs: 8, md: 14 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.08) 0%, transparent 50%)',
            pointerEvents: 'none',
          }}
        />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.2rem', sm: '2.8rem', md: '3.5rem' },
                  fontWeight: 800,
                  mb: 2,
                  animation: visible ? `${fadeInUp} 0.7s ease-out` : 'none',
                }}
              >
                Gérez votre activité
                <br />
                en toute simplicité
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontSize: { xs: '1rem', md: '1.25rem' },
                  mb: 4,
                  opacity: 0.95,
                  maxWidth: '520px',
                  mx: { xs: 'auto', md: 0 },
                  animation: visible ? `${fadeInUp} 0.7s ease-out 0.15s both` : 'none',
                }}
              >
                Facturio : factures, devis, clients et optimisation fiscale. Tout en un.
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  justifyContent: { xs: 'center', md: 'flex-start' },
                  flexWrap: 'wrap',
                  animation: visible ? `${fadeInUp} 0.7s ease-out 0.3s both` : 'none',
                }}
              >
                <Button
                  component={RouterLink}
                  to="/signup"
                  variant="contained"
                  size="large"
                  sx={{
                    bgcolor: 'white',
                    color: '#0f766e',
                    px: 4,
                    py: 1.5,
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    boxShadow: 4,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.92)', boxShadow: 6, transform: 'translateY(-2px)' },
                    transition: 'all 0.2s ease',
                  }}
                >
                  Commencer gratuitement
                </Button>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="outlined"
                  size="large"
                  sx={{
                    borderColor: 'rgba(255,255,255,0.8)',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.12)' },
                    transition: 'all 0.2s ease',
                  }}
                >
                  Se connecter
                </Button>
              </Box>
            </Box>
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                animation: visible ? `${float} 4s ease-in-out infinite` : 'none',
                animationDelay: '0.5s',
              }}
            >
              <Box
                component="img"
                src="/images/facturio-hero.png"
                alt="Interface Facturio - facturation et tableau de bord"
                sx={{
                  maxWidth: '100%',
                  width: { xs: 280, sm: 360, md: 420 },
                  height: 'auto',
                  filter: 'drop-shadow(0 24px 48px rgba(0,0,0,0.2))',
                }}
              />
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Features */}
      <Box id="fonctionnalites" ref={featuresRef} sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              variant="h2"
              sx={{ fontSize: { xs: '1.75rem', md: '2.5rem' }, fontWeight: 700, mb: 2 }}
            >
              Tout ce dont vous avez besoin
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 560, mx: 'auto' }}>
              Une plateforme complète pour gérer efficacement votre activité
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: 3,
            }}
          >
            {features.map((feature, index) => (
              <Card
                key={index}
                sx={{
                  height: '100%',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: 8,
                  },
                  animation: visible ? `${fadeInUp} 0.6s ease-out ${0.1 * index}s both` : 'none',
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Box sx={{ color: 'primary.main', mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <Box
              component="img"
              src="/images/facturio-features.png"
              alt="Fonctionnalités Facturio"
              sx={{ maxWidth: '100%', width: 400, height: 'auto', borderRadius: 2 }}
            />
          </Box>
        </Container>
      </Box>

      {/* CTA */}
      <Box
        id="tarifs"
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: { xs: 8, md: 12 },
        }}
      >
        <Container maxWidth="md">
          <Paper
            elevation={0}
            sx={{
              bgcolor: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(12px)',
              p: { xs: 4, md: 6 },
              textAlign: 'center',
              borderRadius: 4,
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <Typography
              variant="h3"
              sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' }, mb: 2, fontWeight: 700 }}
            >
              Prêt à démarrer ?
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.95 }}>
              Rejoignez des entrepreneurs qui font confiance à Facturio
            </Typography>
            <Button
              component={RouterLink}
              to="/signup"
              variant="contained"
              size="large"
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                px: 5,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.92)', transform: 'translateY(-2px)', boxShadow: 4 },
                transition: 'all 0.2s ease',
              }}
            >
              Créer mon compte gratuitement
            </Button>
          </Paper>
        </Container>
      </Box>
    </Box>
  )
}
