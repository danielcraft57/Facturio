import { Chip, Stack } from '@mui/material'
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import TouchAppOutlinedIcon from '@mui/icons-material/TouchAppOutlined'
import type { EmailEngagement } from './documentEmailEngagement'
import { formatEmailEngagementAt } from './documentEmailEngagement'

type DocumentEmailEngagementChipsProps = {
  engagement?: EmailEngagement | null
}

/** Chips cumulatifs : n’apparaissent qu’après chaque étape (envoyé → vu → cliqué). */
export function DocumentEmailEngagementChips({ engagement }: DocumentEmailEngagementChipsProps) {
  if (!engagement?.emailSent) return null

  const openedWhen = formatEmailEngagementAt(engagement.openedAt)
  const clickedWhen = formatEmailEngagementAt(engagement.clickedAt)
  const clickLabel = engagement.clickLabel ?? 'Cliqué'

  return (
    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
      <Chip
        size="small"
        variant="outlined"
        color="success"
        icon={<MarkEmailReadOutlinedIcon sx={{ fontSize: 18 }} />}
        label={
          engagement.sentAt
            ? `Envoyé — ${formatEmailEngagementAt(engagement.sentAt)}`
            : 'Envoyé'
        }
      />
      {engagement.opened && (
        <Chip
          size="small"
          variant="outlined"
          color="info"
          icon={<VisibilityOutlinedIcon sx={{ fontSize: 18 }} />}
          label={openedWhen ? `Vu — ${openedWhen}` : 'Vu'}
        />
      )}
      {engagement.clicked && (
        <Chip
          size="small"
          variant="outlined"
          color="primary"
          icon={<TouchAppOutlinedIcon sx={{ fontSize: 18 }} />}
          label={clickedWhen ? `${clickLabel} — ${clickedWhen}` : clickLabel}
        />
      )}
    </Stack>
  )
}
