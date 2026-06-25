import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  alpha,
} from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { Link as RouterLink } from 'react-router-dom'
import { MarketingHero } from '../components/MarketingHero'
import { CtaSection } from '../components/CtaSection'
import { ScrollReveal } from '../components/ScrollReveal'
import { MarketingImage } from '../components/MarketingImage'
import { BetaTesterPromo } from '../components/BetaTesterPromo'
import { CATALOG_PACKS, CTA, VERTICAL_SEGMENTS, WORKFLOWS } from '../constants/siteContent'

export function PrestationsPage() {
  return (
    <Box>
      <MarketingHero
        compact
        badge="Forfait · Mensuel · Au projet"
        title="Facturez comme vous vendez vos prestations"
        subtitle="Site vitrine, campagne de communication, identité visuelle, maintenance client — un catalogue qui parle votre métier, pas le retail."
        primaryCta={CTA.signupFree}
        secondaryCta={CTA.pricing}
        visual={<MarketingImage src="/images/facturio-prestations.jpg" alt="Catalogue de prestations digitales" float={false} />}
      />

      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
        <ScrollReveal>
          <Typography variant="h2" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: '1.5rem', md: '2rem' } }}>
            Vos types de missions
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 640 }}>
            Freelance, studio créatif, consultant marketing ou petite équipe : mêmes parcours, même préparation pour 2026.
          </Typography>
        </ScrollReveal>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, mb: 8 }}>
          {VERTICAL_SEGMENTS.map((seg, i) => (
            <ScrollReveal key={seg.title} delayMs={i * 70}>
              <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {seg.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {seg.description}
                  </Typography>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            gap: 5,
            mb: 8,
          }}
        >
          <ScrollReveal>
            <MarketingImage src="/images/facturio-workflow.jpg" alt="Workflow facturation prestations" maxWidth={420} />
          </ScrollReveal>
          <Box sx={{ flex: 1 }}>
            <ScrollReveal delayMs={80}>
              <Typography variant="h2" sx={{ fontWeight: 700, mb: 4, fontSize: { xs: '1.5rem', md: '2rem' } }}>
                Parcours types
              </Typography>
            </ScrollReveal>
            <Box sx={{ display: 'grid', gap: 2 }}>
              {WORKFLOWS.map((w, i) => (
                <ScrollReveal key={w.title} delayMs={100 + i * 60}>
                  <Card sx={{ bgcolor: 'background.default' }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        {w.title}
                      </Typography>
                      <List dense disablePadding>
                        {w.steps.map((step) => (
                          <ListItem key={step} disableGutters sx={{ py: 0.35 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <CheckCircleOutlineIcon color="primary" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={step} primaryTypographyProps={{ variant: 'body2' }} />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </Box>
          </Box>
        </Box>

        <ScrollReveal>
          <Typography variant="h2" sx={{ fontWeight: 700, mb: 3, fontSize: { xs: '1.5rem', md: '2rem' } }}>
            Packs de prestations (en option)
          </Typography>
        </ScrollReveal>
        <Grid container spacing={3} sx={{ mb: 8 }}>
          {CATALOG_PACKS.map((pack, i) => (
            <Grid key={pack.id} size={{ xs: 12, md: 4 }}>
              <ScrollReveal delayMs={i * 60}>
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    bgcolor: (t) => alpha(t.palette.primary.main, 0.03),
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {pack.name}
                    </Typography>
                    <Typography variant="h5" fontWeight={800} color="primary.main" gutterBottom>
                      {pack.price} <Typography component="span" variant="caption" color="text.secondary">{pack.priceNote}</Typography>
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {pack.description}
                    </Typography>
                    <Button component={RouterLink} to="/signup" size="small" variant="outlined">
                      {pack.cta}
                    </Button>
                  </CardContent>
                </Card>
              </ScrollReveal>
            </Grid>
          ))}
        </Grid>

        <ScrollReveal>
          <Box sx={{ p: 4, borderRadius: 3, bgcolor: 'action.hover' }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Exemples de prestations déjà dans l'outil
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              À l'inscription, vous avez déjà des modèles (site, campagne, logo, maintenance…). Vous les adaptez
              à votre activité tout en gardant les bonnes infos pour la facture électronique.
            </Typography>
            <Button component={RouterLink} to={CTA.features.to} endIcon={<ArrowForwardIcon />}>
              {CTA.features.label}
            </Button>
          </Box>
        </ScrollReveal>
      </Container>

      <CtaSection
        title="Ça correspond à votre activité ?"
        subtitle="Créez un compte gratuit, choisissez un pack de prestations et envoyez votre premier devis aujourd'hui."
        primaryLabel={CTA.signupFree.label}
        primaryTo={CTA.signupFree.to}
        secondaryLabel={CTA.betaSignup.label}
        secondaryTo={CTA.betaSignup.to}
      />
    </Box>
  )
}
