import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Box, keyframes } from '@mui/material'
import { SettingsPageSkeleton } from './SettingsPageSkeleton'

const settingsEnter = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

/** Zone de contenu paramètres avec transition à chaque changement de route. */
export function AnimatedSettingsOutlet() {
  const location = useLocation()

  return (
    <Box
      key={location.pathname}
      sx={{
        minWidth: 0,
        minHeight: 240,
        animation: `${settingsEnter} 0.28s cubic-bezier(0.22, 1, 0.36, 1) both`,
        willChange: 'opacity, transform',
      }}
    >
      <Suspense fallback={<SettingsPageSkeleton />}>
        <Outlet />
      </Suspense>
    </Box>
  )
}
