import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Paper,
  GridLegacy,
  Alert,
} from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import PeopleIcon from '@mui/icons-material/People'
import AssessmentIcon from '@mui/icons-material/Assessment'
import SecurityIcon from '@mui/icons-material/Security'
import SpeedIcon from '@mui/icons-material/Speed'
import { useAuthStore } from '../../../stores/authStore'

function isLocalAccess(): boolean {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1' || host === ''
}

/**
 * Page d'accueil publique (Landing Page).
 * En local : redirection auto vers le dashboard. En prod : si déjà connecté, redirection vers le dashboard.
 */
export function LandingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const accessMessage = (location.state as any)?.message
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    if (isLocalAccess()) {
      navigate('/dashboard', { replace: true })
    } else if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate, isAuthenticated])

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

  return (
    <Box>
      {accessMessage && (
        <Container maxWidth="lg" sx={{ pt: 2 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {accessMessage}
          </Alert>
        </Container>
      )}
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.5rem', md: '4rem' },
                fontWeight: 700,
                mb: 2,
              }}
            >
              Gérez votre activité
              <br />
              en toute simplicité
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontSize: { xs: '1.1rem', md: '1.5rem' },
                mb: 4,
                opacity: 0.9,
                maxWidth: '700px',
                mx: 'auto',
              }}
            >
              Facturio est la solution complète pour gérer vos factures, clients,
              devis et optimiser votre fiscalité.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                component={RouterLink}
                to="/signup"
                variant="contained"
                size="large"
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.9)',
                  },
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
                  borderColor: 'white',
                  color: 'white',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                Se connecter
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '3rem' }, mb: 2, fontWeight: 700 }}>
            Tout ce dont vous avez besoin
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: '600px', mx: 'auto' }}>
            Une plateforme complète pour gérer efficacement votre activité
          </Typography>
        </Box>

        <GridLegacy container spacing={4}>
          {features.map((feature, index) => (
            <GridLegacy item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Box sx={{ color: 'primary.main', mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </GridLegacy>
          ))}
        </GridLegacy>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: { xs: 6, md: 8 },
        }}
      >
        <Container maxWidth="md">
          <Paper
            elevation={0}
            sx={{
              bgcolor: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              p: { xs: 4, md: 6 },
              textAlign: 'center',
              borderRadius: 3,
            }}
          >
            <Typography
              variant="h3"
              sx={{ fontSize: { xs: '1.8rem', md: '2.5rem' }, mb: 2, fontWeight: 700 }}
            >
              Prêt à démarrer ?
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
              Rejoignez des centaines d'entrepreneurs qui font confiance à Facturio
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
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.9)',
                },
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

