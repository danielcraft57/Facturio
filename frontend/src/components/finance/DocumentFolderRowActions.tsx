import { useState } from 'react'
import { IconButton, Tooltip, Menu, MenuItem } from '@mui/material'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import LabelImportantIcon from '@mui/icons-material/LabelImportant'
import LabelImportantOutlinedIcon from '@mui/icons-material/LabelImportantOutlined'
import ScheduleIcon from '@mui/icons-material/Schedule'
import type { DocumentFlags } from '../../types/documentFolders'

type DocumentFolderRowActionsProps = {
  starred: boolean
  important: boolean
  onUpdate: (patch: DocumentFlags) => void
  compact?: boolean
}

export function DocumentFolderRowActions({
  starred,
  important,
  onUpdate,
  compact,
}: DocumentFolderRowActionsProps) {
  const [snoozeAnchor, setSnoozeAnchor] = useState<null | HTMLElement>(null)

  const snooze = (days: number) => {
    const d = new Date()
    d.setDate(d.getDate() + days)
    onUpdate({ snoozedUntil: d.toISOString() })
    setSnoozeAnchor(null)
  }

  return (
    <>
      <Tooltip title={starred ? 'Retirer du suivi' : 'Suivi'}>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation()
            onUpdate({ starred: !starred })
          }}
        >
          {starred ? (
            <StarIcon fontSize="small" sx={{ color: '#f59e0b' }} />
          ) : (
            <StarBorderIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>
      <Tooltip title={important ? 'Retirer important' : 'Marquer important'}>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation()
            onUpdate({ important: !important })
          }}
        >
          {important ? (
            <LabelImportantIcon fontSize="small" sx={{ color: '#eab308' }} />
          ) : (
            <LabelImportantOutlinedIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>
      {!compact && (
        <>
          <Tooltip title="Reporter">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                setSnoozeAnchor(e.currentTarget)
              }}
            >
              <ScheduleIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={snoozeAnchor}
            open={Boolean(snoozeAnchor)}
            onClose={() => setSnoozeAnchor(null)}
          >
            <MenuItem onClick={() => snooze(1)}>Demain</MenuItem>
            <MenuItem onClick={() => snooze(7)}>Dans 7 jours</MenuItem>
            <MenuItem onClick={() => onUpdate({ snoozedUntil: null })}>Réactiver</MenuItem>
          </Menu>
        </>
      )}
    </>
  )
}
