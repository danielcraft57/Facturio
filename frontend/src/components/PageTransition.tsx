import type { ReactNode } from 'react'
import { Box, Fade } from '@mui/material'
import { useLocation } from 'react-router-dom'

type PageTransitionProps = {
  children: ReactNode
}

/**
 * Fondu léger à chaque changement de route (zone principale de l’app).
 */
export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation()

  return (
    <Fade key={location.pathname + location.search} in timeout={{ enter: 220, exit: 120 }}>
      <Box sx={{ width: '100%' }}>{children}</Box>
    </Fade>
  )
}
