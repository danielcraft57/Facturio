import { Chip, type ChipProps } from '@mui/material'
import { alpha } from '@mui/material/styles'

type ProPlanBadgeProps = {
  size?: 'small' | 'medium'
}

/**
 * Badge visuel uniforme pour les entrées réservées au plan Pro.
 */
export function ProPlanBadge({ size = 'small' }: ProPlanBadgeProps) {
  const chipSize: ChipProps['size'] = size === 'medium' ? 'medium' : 'small'
  return (
    <Chip
      label="Pro"
      size={chipSize}
      sx={{
        height: size === 'medium' ? 22 : 18,
        fontSize: size === 'medium' ? '0.7rem' : '0.62rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        bgcolor: alpha('#b45309', 0.14),
        color: '#b45309',
        border: `1px solid ${alpha('#b45309', 0.28)}`,
        '& .MuiChip-label': { px: size === 'medium' ? 1 : 0.75 },
      }}
    />
  )
}
