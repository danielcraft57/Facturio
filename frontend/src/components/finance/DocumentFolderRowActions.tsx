import { useState } from 'react'
import { IconButton, Tooltip, Menu, MenuItem } from '@mui/material'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import LabelImportantIcon from '@mui/icons-material/LabelImportant'
import LabelImportantOutlinedIcon from '@mui/icons-material/LabelImportantOutlined'
import ScheduleIcon from '@mui/icons-material/Schedule'
import type { DocumentFlags } from '../../types/documentFolders'

/** Couleur « Suivi » (étoile). */
export const DOCUMENT_FLAG_STAR_COLOR = '#f59e0b'
/** Couleur « Important » (drapeau). */
export const DOCUMENT_FLAG_IMPORTANT_COLOR = '#dc2626'

type DocumentFolderRowActionsProps = {
  starred: boolean
  important: boolean
  onUpdate: (patch: DocumentFlags) => void | Promise<void>
  compact?: boolean
}

export function DocumentFolderRowActions({
  starred,
  important,
  onUpdate,
  compact,
}: DocumentFolderRowActionsProps) {
  const [snoozeAnchor, setSnoozeAnchor] = useState<null | HTMLElement>(null)
  const [pending, setPending] = useState<'star' | 'important' | 'snooze' | null>(null)

  const runUpdate = async (patch: DocumentFlags, key: typeof pending) => {
    if (pending) return
    setPending(key)
    try {
      await onUpdate(patch)
    } finally {
      setPending(null)
    }
  }

  const snooze = (days: number) => {
    const d = new Date()
    d.setDate(d.getDate() + days)
    void runUpdate({ snoozedUntil: d.toISOString() }, 'snooze')
    setSnoozeAnchor(null)
  }

  return (
    <>
      <Tooltip title={starred ? 'Retirer du suivi' : 'Suivi'}>
        <span>
          <IconButton
            size="small"
            disabled={pending === 'star'}
            onClick={(e) => {
              e.stopPropagation()
              void runUpdate({ starred: !starred }, 'star')
            }}
            sx={{
              '&:hover .star-icon': {
                color: DOCUMENT_FLAG_STAR_COLOR,
              },
            }}
          >
            {starred ? (
              <StarIcon
                className="star-icon"
                fontSize="small"
                sx={{ color: DOCUMENT_FLAG_STAR_COLOR }}
              />
            ) : (
              <StarBorderIcon className="star-icon" fontSize="small" />
            )}
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={important ? 'Retirer important' : 'Marquer important'}>
        <span>
          <IconButton
            size="small"
            disabled={pending === 'important'}
            onClick={(e) => {
              e.stopPropagation()
              void runUpdate({ important: !important }, 'important')
            }}
            sx={{
              '&:hover .important-icon': {
                color: DOCUMENT_FLAG_IMPORTANT_COLOR,
              },
            }}
          >
            {important ? (
              <LabelImportantIcon
                className="important-icon"
                fontSize="small"
                sx={{ color: DOCUMENT_FLAG_IMPORTANT_COLOR }}
              />
            ) : (
              <LabelImportantOutlinedIcon className="important-icon" fontSize="small" />
            )}
          </IconButton>
        </span>
      </Tooltip>
      {!compact && (
        <>
          <Tooltip title="Reporter">
            <IconButton
              size="small"
              disabled={pending === 'snooze'}
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
            <MenuItem onClick={() => void runUpdate({ snoozedUntil: null }, 'snooze')}>
              Réactiver
            </MenuItem>
          </Menu>
        </>
      )}
    </>
  )
}
