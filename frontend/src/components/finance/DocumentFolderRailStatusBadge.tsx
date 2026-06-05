import { Box } from '@mui/material'
import { alpha } from '@mui/material/styles'
import type { DocumentFolderRailVisual } from './documentFolderRowRailVisual'
import { DocumentFolderStatusSlideSwap } from './DocumentFolderStatusSlideSwap'

const BADGE_SIZE = 36
const RAIL_VIEWPORT = 44

type Props = {
  visual: DocumentFolderRailVisual
  unread?: boolean
  emphasized?: boolean
}

export function DocumentFolderRailStatusBadge({
  visual,
  unread = false,
  emphasized = false,
}: Props) {
  const { Icon } = visual
  const statusKey = visual.iconTitle

  const badge = (
    <Box
      role="img"
      aria-label={visual.iconTitle}
      sx={{
        width: BADGE_SIZE,
        height: BADGE_SIZE,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        bgcolor: visual.accent,
        color: '#fff',
        transform: emphasized ? 'scale(1.06)' : 'scale(1)',
        transition: 'transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
        boxShadow: unread
          ? `0 0 0 2px ${alpha(visual.accent, 0.55)}, 0 0 0 3px ${alpha('#fff', 0.95)}`
          : `0 0 0 1px ${alpha(visual.accent, 0.35)}`,
      }}
    >
      <Icon sx={{ fontSize: 19 }} />
    </Box>
  )

  return (
    <DocumentFolderStatusSlideSwap
      statusKey={statusKey}
      variant="rail"
      minHeight={RAIL_VIEWPORT}
      width={RAIL_VIEWPORT}
    >
      {badge}
    </DocumentFolderStatusSlideSwap>
  )
}
