import type { PropsWithChildren } from 'react'
import { Box, Container } from '@mui/material'
import { demoPublicPageSx } from './demoTheme'

type DemoPublicShellProps = PropsWithChildren<{
  /** Largeur max du contenu centré */
  maxWidth?: 'xs' | 'sm' | 'md'
}>

/**
 * Enveloppe Tron pour les pages publiques démo (`/essayer`).
 * Grille néon sur fond void — cohérent avec l'affiche Legacy.
 */
export function DemoPublicShell({ children, maxWidth = 'sm' }: DemoPublicShellProps) {
  return (
    <Box sx={demoPublicPageSx()}>
      <Container maxWidth={maxWidth}>
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', py: { xs: 6, sm: 8 } }}>
          {children}
        </Box>
      </Container>
    </Box>
  )
}
