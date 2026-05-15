import type { ReactNode } from 'react'
import { Box, Typography } from '@mui/material'

type PageHeaderProps = {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', sm: 'flex-end' },
        gap: 2,
        mb: 3,
      }}
    >
      <Box>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 800,
            letterSpacing: '-0.03em',
            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
            color: 'text.primary',
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 520 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: { xs: 'stretch', sm: 'flex-end' } }}>
          {actions}
        </Box>
      )}
    </Box>
  )
}
