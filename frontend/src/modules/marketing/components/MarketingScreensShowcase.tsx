import { Box, Container, Grid, Typography } from '@mui/material'
import { ScrollReveal } from './ScrollReveal'
import { OverflowScreenshotFrame } from './OverflowScreenshotFrame'

export type MarketingScreenItem = {
  slug: string
  label: string
  alt: string
  frameHeight?: number
  durationSec?: number
  distanceRatio?: number
  delaySec?: number
}

const CAPTURE_BASE = '/images/marketing/overflow/captures'

/** Écrans variés pour la landing — fichiers générés par capture-marketing-screenshots.mjs */
export const MARKETING_SHOWCASE_SCREENS: MarketingScreenItem[] = [
  {
    slug: 'dashboard',
    label: 'Tableau de bord',
    alt: 'Indicateurs, graphiques et factures récentes',
    frameHeight: 260,
    durationSec: 13,
    distanceRatio: 0.55,
  },
  {
    slug: 'produits-catalogue',
    label: 'Catalogue produits',
    alt: 'Grille catalogue avec visuels et catégories',
    frameHeight: 280,
    durationSec: 11,
    distanceRatio: 0.5,
    delaySec: 0.3,
  },
  {
    slug: 'clients-prospects',
    label: 'Clients',
    alt: 'Carnet clients et statuts',
    frameHeight: 250,
    durationSec: 10,
    distanceRatio: 0.45,
    delaySec: 0.6,
  },
  {
    slug: 'factures-inbox',
    label: 'Factures',
    alt: 'Liste des factures avec dossiers et statuts',
    frameHeight: 270,
    durationSec: 12,
    distanceRatio: 0.6,
    delaySec: 0.2,
  },
  {
    slug: 'devis-inbox',
    label: 'Devis',
    alt: 'Pipeline commercial des devis',
    frameHeight: 270,
    durationSec: 12,
    distanceRatio: 0.58,
    delaySec: 0.5,
  },
  {
    slug: 'comptabilite',
    label: 'Comptabilité',
    alt: 'Grand livre et rapports',
    frameHeight: 255,
    durationSec: 11,
    distanceRatio: 0.5,
    delaySec: 0.8,
  },
  {
    slug: 'parametres-entreprise',
    label: 'Entreprise',
    alt: 'Paramètres société et conformité',
    frameHeight: 240,
    durationSec: 10,
    distanceRatio: 0.42,
    delaySec: 1,
  },
  {
    slug: 'devis-detail',
    label: 'Détail devis',
    alt: 'Devis accepté avec acompte',
    frameHeight: 265,
    durationSec: 11,
    distanceRatio: 0.52,
    delaySec: 0.4,
  },
]

type MarketingScreensShowcaseProps = {
  title?: string
  subtitle?: string
  screens?: MarketingScreenItem[]
}

export function MarketingScreensShowcase({
  title = 'L’interface, sans compromis UX',
  subtitle = 'Clients, catalogue, factures, devis, tableau de bord et compta — le même outil, des vues adaptées à chaque tâche.',
  screens = MARKETING_SHOWCASE_SCREENS,
}: MarketingScreensShowcaseProps) {
  return (
    <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <ScrollReveal>
          <Typography
            variant="h2"
            align="center"
            sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' }, fontWeight: 700, mb: 1 }}
          >
            {title}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            align="center"
            sx={{ mb: 5, maxWidth: 640, mx: 'auto' }}
          >
            {subtitle}
          </Typography>
        </ScrollReveal>

        <Grid container spacing={3}>
          {screens.map((screen, i) => (
            <Grid key={screen.slug} size={{ xs: 12, sm: 6, lg: 3 }}>
              <ScrollReveal delayMs={i * 60}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, px: 0.5 }}>
                  {screen.label}
                </Typography>
                <OverflowScreenshotFrame
                  src={`${CAPTURE_BASE}/${screen.slug}.png`}
                  alt={screen.alt}
                  frameHeight={screen.frameHeight ?? 250}
                  durationSec={screen.durationSec ?? 11}
                  distanceRatio={screen.distanceRatio ?? 0.5}
                  delaySec={screen.delaySec ?? 0}
                />
              </ScrollReveal>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}
