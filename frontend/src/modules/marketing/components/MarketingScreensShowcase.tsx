import { Box, Container, Grid, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { ScrollReveal } from './ScrollReveal'
import { OverflowScreenshotFrame, type ResponsiveFrameHeight } from './OverflowScreenshotFrame'
import { ScreenshotLightbox } from './ScreenshotLightbox'

export type MarketingScreenItem = {
  slug: string
  label: string
  alt: string
  frameHeight?: ResponsiveFrameHeight
  durationSec?: number
  distanceRatio?: number
  delaySec?: number
}

const CAPTURE_BASE = '/images/marketing/overflow/captures'

/** Hauteur max commune — plus généreuse sur mobile (pleine largeur) pour mieux voir l'UI */
const SHOWCASE_FRAME_MAX: ResponsiveFrameHeight = { xs: 260, sm: 252, md: 268, lg: 276 }

/** Écrans variés pour la landing — fichiers générés par capture-marketing-screenshots.mjs */
export const MARKETING_SHOWCASE_SCREENS: MarketingScreenItem[] = [
  {
    slug: 'dashboard',
    label: 'Tableau de bord',
    alt: 'Indicateurs, graphiques et factures récentes',
    durationSec: 13,
    distanceRatio: 0.55,
  },
  {
    slug: 'produits-catalogue',
    label: 'Catalogue produits',
    alt: 'Grille catalogue avec visuels et catégories',
    durationSec: 11,
    distanceRatio: 0.5,
    delaySec: 0.3,
  },
  {
    slug: 'clients-prospects',
    label: 'Clients',
    alt: 'Carnet clients et statuts',
    durationSec: 10,
    distanceRatio: 0.45,
    delaySec: 0.6,
  },
  {
    slug: 'factures-inbox',
    label: 'Factures',
    alt: 'Liste des factures avec dossiers et statuts',
    durationSec: 12,
    distanceRatio: 0.6,
    delaySec: 0.2,
  },
  {
    slug: 'devis-inbox',
    label: 'Devis',
    alt: 'Pipeline commercial des devis',
    durationSec: 12,
    distanceRatio: 0.58,
    delaySec: 0.5,
  },
  {
    slug: 'comptabilite',
    label: 'Suivi & exports',
    alt: 'Tableau de suivi et exports pour le comptable',
    durationSec: 11,
    distanceRatio: 0.5,
    delaySec: 0.8,
  },
  {
    slug: 'parametres-entreprise',
    label: 'Entreprise',
    alt: 'Paramètres société et conformité',
    durationSec: 10,
    distanceRatio: 0.42,
    delaySec: 1,
  },
  {
    slug: 'devis-detail',
    label: 'Détail devis',
    alt: 'Devis accepté avec acompte',
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
  title = 'À quoi ressemble l\'outil au quotidien',
  subtitle = 'Clients, catalogue, factures, devis, tableau de bord… Cliquez sur une capture pour l\'agrandir.',
  screens = MARKETING_SHOWCASE_SCREENS,
}: MarketingScreensShowcaseProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const lightboxItems = useMemo(
    () =>
      screens.map((screen) => ({
        src: `${CAPTURE_BASE}/${screen.slug}.png`,
        label: screen.label,
        alt: screen.alt,
      })),
    [screens],
  )

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

        <Grid container spacing={{ xs: 2.5, sm: 3 }}>
          {screens.map((screen, i) => (
            <Grid key={screen.slug} size={{ xs: 12, sm: 6, lg: 3 }}>
              <ScrollReveal delayMs={i * 60}>
                <Typography
                  variant="subtitle2"
                  fontWeight={700}
                  sx={{ mb: { xs: 1, md: 1.25 }, px: 0.5, fontSize: { xs: '0.875rem', md: '0.9375rem' } }}
                >
                  {screen.label}
                </Typography>
                <OverflowScreenshotFrame
                  src={`${CAPTURE_BASE}/${screen.slug}.png`}
                  alt={screen.alt}
                  frameHeight={screen.frameHeight ?? SHOWCASE_FRAME_MAX}
                  durationSec={screen.durationSec ?? 11}
                  distanceRatio={screen.distanceRatio ?? 0.5}
                  delaySec={screen.delaySec ?? 0}
                  onOpenLightbox={() => setLightboxIndex(i)}
                />
              </ScrollReveal>
            </Grid>
          ))}
        </Grid>

        <ScreenshotLightbox
          open={lightboxIndex !== null}
          items={lightboxItems}
          index={lightboxIndex ?? 0}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      </Container>
    </Box>
  )
}
