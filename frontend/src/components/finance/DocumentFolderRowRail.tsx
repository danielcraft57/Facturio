import { useCallback, useEffect, useRef, useState } from 'react'
import { Box, IconButton, Menu, MenuItem, TableCell, Tooltip, useMediaQuery } from '@mui/material'
import { alpha, keyframes } from '@mui/material/styles'
import type { SxProps, Theme } from '@mui/material/styles'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import LabelImportantIcon from '@mui/icons-material/LabelImportant'
import LabelImportantOutlinedIcon from '@mui/icons-material/LabelImportantOutlined'
import ScheduleIcon from '@mui/icons-material/Schedule'
import type { DocumentFlags } from '../../types/documentFolders'
import {
  DOCUMENT_FLAG_IMPORTANT_COLOR,
  DOCUMENT_FLAG_STAR_COLOR,
} from './DocumentFolderRowActions'
import type { DocumentFolderRailVisual } from './documentFolderRowRailVisual'
import { DocumentTagsEditor } from './DocumentTagsEditor'

/** Barre de statut collée au bord gauche de la ligne (via `getDocumentFolderRailRowAccentSx`). */
export const DOCUMENT_FOLDER_RAIL_ACCENT_WIDTH = 4

/** Colonne icône de statut uniquement. */
const RAIL_ICON_SLOT_WIDTH = 44

/** Délai avant fermeture du panneau suivi / important / tags (évite la disparition trop rapide). */
const HOVER_PANEL_CLOSE_MS = 520

export type DocumentFolderRailBulkHeaderProps = {
  allVisibleSelected: boolean
  someVisibleSelected: boolean
  selectionActive: boolean
  onToggleAll: () => void
}

export const documentFolderStatusRailZoneClass = 'document-folder-status-rail-zone'
export const documentFolderTableRowClass = 'document-folder-table-row'
export const documentFolderRailCellClass = 'doc-folder-rail-cell'

export type DocumentFolderRailTagsProps = {
  tags: string[]
  onChange: (tags: string[]) => void
  savedTags?: string[]
  onRememberTag?: (tag: string) => void | Promise<void>
  onRemoveSavedTag?: (tag: string) => void | Promise<void>
}

type Props = {
  visual: DocumentFolderRailVisual
  starred: boolean
  important: boolean
  showImportant?: boolean
  showTags?: boolean
  /** Suivi / important / reporter (désactivé pour les clients). */
  showActions?: boolean
  unread?: boolean
  onUpdate: (patch: DocumentFlags) => void | Promise<void>
  layout?: 'table' | 'card'
  tagsSlot?: DocumentFolderRailTagsProps
}

const iconPop = keyframes`
  0% { opacity: 0; transform: scale(0.45) rotate(-8deg); }
  70% { transform: scale(1.08) rotate(0deg); }
  100% { opacity: 1; transform: scale(1) rotate(0deg); }
`

const actionSlide = keyframes`
  0% { opacity: 0; transform: translateX(-8px) scale(0.9); }
  100% { opacity: 1; transform: translateX(0) scale(1); }
`

const panelReveal = keyframes`
  0% { opacity: 0; transform: translateY(-50%) translateX(-10px) scale(0.96); }
  100% { opacity: 1; transform: translateY(-50%) translateX(0) scale(1); }
`

export function getDocumentFolderRailRowAccentSx(
  visual: DocumentFolderRailVisual,
): SxProps<Theme> {
  return {
    '& > .MuiTableCell-root:first-of-type': {
      borderLeft: `${DOCUMENT_FOLDER_RAIL_ACCENT_WIDTH}px solid ${visual.accent}`,
    },
  }
}

export function getDocumentFolderRailTableCellSx(
  _opts?: { withTags?: boolean; showImportant?: boolean },
): SxProps<Theme> {
  return {
    width: RAIL_ICON_SLOT_WIDTH,
    minWidth: RAIL_ICON_SLOT_WIDTH,
    maxWidth: RAIL_ICON_SLOT_WIDTH,
    p: 0,
    verticalAlign: 'middle',
    overflow: 'visible',
    position: 'relative',
    borderLeft: 'none',
  }
}

export function getDocumentFolderRailHeaderRowSx(): SxProps<Theme> {
  return {
    '& > .MuiTableCell-root:first-of-type': {
      borderLeft: `${DOCUMENT_FOLDER_RAIL_ACCENT_WIDTH}px solid transparent`,
    },
  }
}

export function getDocumentFolderRailHeaderCellSx(): SxProps<Theme> {
  return getDocumentFolderRailTableCellSx()
}

/** @deprecated Préférer getDocumentFolderRailTableCellSx() */
export const documentFolderRailTableCellSx = getDocumentFolderRailTableCellSx()

function controlPanelWidth(showImportant: boolean, withTags: boolean): number {
  const actionsW = showImportant ? 100 : 84
  return withTags ? actionsW + 8 : actionsW
}

export function DocumentFolderRowRail({
  visual,
  starred,
  important,
  showImportant = true,
  showTags = true,
  showActions = true,
  unread = false,
  onUpdate,
  layout = 'table',
  tagsSlot,
}: Props) {
  const { Icon } = visual
  const [snoozeAnchor, setSnoozeAnchor] = useState<null | HTMLElement>(null)
  const [pending, setPending] = useState<'star' | 'important' | 'snooze' | null>(null)
  const [controlsOpen, setControlsOpen] = useState(false)
  const [tagsPopoverOpen, setTagsPopoverOpen] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTable = layout === 'table'
  const hoverCapable = useMediaQuery('(hover: hover)')
  const useDelayedHover = isTable && hoverCapable && showActions
  const withTags = showTags && !!tagsSlot
  const actionCount = showImportant ? 3 : 2
  const panelW = controlPanelWidth(showImportant, withTags)
  const panelPinned = Boolean(snoozeAnchor) || tagsPopoverOpen
  const panelVisible = showActions && (!useDelayedHover || controlsOpen || panelPinned)

  const cancelCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const openControls = useCallback(() => {
    if (!useDelayedHover) return
    cancelCloseTimer()
    setControlsOpen(true)
  }, [useDelayedHover, cancelCloseTimer])

  const scheduleCloseControls = useCallback(() => {
    if (!useDelayedHover || panelPinned) return
    cancelCloseTimer()
    closeTimerRef.current = setTimeout(() => setControlsOpen(false), HOVER_PANEL_CLOSE_MS)
  }, [useDelayedHover, panelPinned, cancelCloseTimer])

  useEffect(() => () => cancelCloseTimer(), [cancelCloseTimer])

  useEffect(() => {
    if (snoozeAnchor) {
      cancelCloseTimer()
      setControlsOpen(true)
    }
  }, [snoozeAnchor, cancelCloseTimer])

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

  const actionBtnSx = {
    p: 0.35,
    transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
    '&:hover': { transform: 'scale(1.12)' },
  }

  const panelPaperSx: SxProps<Theme> = {
    bgcolor: 'background.paper',
    borderRadius: 2,
    border: 1,
    borderColor: 'divider',
    boxShadow: (t) =>
      t.palette.mode === 'dark'
        ? `0 12px 32px ${alpha('#000', 0.45)}`
        : `0 10px 28px ${alpha('#0f172a', 0.12)}, 0 2px 8px ${alpha('#0f172a', 0.06)}`,
  }

  const hoverRevealSx: SxProps<Theme> = useDelayedHover
    ? {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 0.35,
        ml: 0.25,
        py: 0.65,
        maxWidth: panelW + 24,
        overflow: 'hidden',
        opacity: panelVisible ? 1 : 0,
        width: panelVisible ? 'auto' : 0,
        minWidth: panelVisible ? panelW : 0,
        px: panelVisible ? 0.75 : 0,
        pointerEvents: panelVisible ? 'auto' : 'none',
        transition:
          'opacity 0.2s ease, width 0.22s ease, min-width 0.22s ease, padding 0.22s ease',
        ...panelPaperSx,
        ...(panelVisible
          ? {
              animation: `${panelReveal} 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
              '& .doc-folder-action-btn': {
                animation: `${actionSlide} 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
              },
              ...Object.fromEntries(
                Array.from({ length: actionCount }, (_, i) => [
                  `& .doc-folder-action-btn:nth-of-type(${i + 1})`,
                  { animationDelay: `${i * 50}ms` },
                ]),
              ),
            }
          : {}),
      }
    : {
        '@media (hover: none)': {
          position: 'relative',
          opacity: 1,
          pointerEvents: 'auto',
          transform: 'none',
          boxShadow: 'none',
          border: 'none',
          bgcolor: 'transparent',
          mt: 0.35,
        },
        '@media (hover: hover)': {
          position: 'absolute',
          left: '100%',
          top: '50%',
          zIndex: 14,
          ml: 0,
          minWidth: panelW,
          py: 0.65,
          px: 0.75,
          opacity: 0,
          pointerEvents: 'none',
          transform: 'translateY(-50%) translateX(-8px)',
          transition:
            'opacity 0.2s ease, transform 0.26s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease',
          ...panelPaperSx,
          [`.${documentFolderStatusRailZoneClass}:hover &`]: {
            opacity: 1,
            pointerEvents: 'auto',
            transform: 'translateY(-50%) translateX(0)',
            animation: `${panelReveal} 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
          },
          [`.${documentFolderStatusRailZoneClass}:hover & .doc-folder-action-btn`]: {
            animation: `${actionSlide} 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
          },
          ...Object.fromEntries(
            Array.from({ length: actionCount }, (_, i) => [
              `.${documentFolderStatusRailZoneClass}:hover & .doc-folder-action-btn:nth-of-type(${i + 1})`,
              { animationDelay: `${i * 50}ms` },
            ]),
          ),
        },
      }

  const flyoutRowSx: SxProps<Theme> = useDelayedHover
    ? {
        position: 'absolute',
        left: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'inline-flex',
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'nowrap',
        zIndex: panelVisible ? 20 : 14,
      }
    : {}

  const actionsRow = (
    <Box
      className="document-folder-row-actions"
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 0,
        flexWrap: 'nowrap',
      }}
    >
      <Tooltip title={starred ? 'Retirer du suivi' : 'Suivi'}>
        <span className="doc-folder-action-btn">
          <IconButton
            size="small"
            disabled={pending === 'star'}
            onClick={(e) => {
              e.stopPropagation()
              void runUpdate({ starred: !starred }, 'star')
            }}
            sx={{
              ...actionBtnSx,
              '&:hover .star-icon': { color: DOCUMENT_FLAG_STAR_COLOR },
            }}
          >
            {starred ? (
              <StarIcon
                className="star-icon"
                sx={{ fontSize: 18, color: DOCUMENT_FLAG_STAR_COLOR }}
              />
            ) : (
              <StarBorderIcon className="star-icon" sx={{ fontSize: 18 }} />
            )}
          </IconButton>
        </span>
      </Tooltip>
      {showImportant && (
        <Tooltip title={important ? 'Retirer important' : 'Marquer important'}>
          <span className="doc-folder-action-btn">
            <IconButton
              size="small"
              disabled={pending === 'important'}
              onClick={(e) => {
                e.stopPropagation()
                void runUpdate({ important: !important }, 'important')
              }}
              sx={{
                ...actionBtnSx,
                '&:hover .important-icon': { color: DOCUMENT_FLAG_IMPORTANT_COLOR },
              }}
            >
              {important ? (
                <LabelImportantIcon
                  className="important-icon"
                  sx={{ fontSize: 18, color: DOCUMENT_FLAG_IMPORTANT_COLOR }}
                />
              ) : (
                <LabelImportantOutlinedIcon className="important-icon" sx={{ fontSize: 18 }} />
              )}
            </IconButton>
          </span>
        </Tooltip>
      )}
      <Tooltip title="Reporter">
        <span className="doc-folder-action-btn">
          <IconButton
            size="small"
            disabled={pending === 'snooze'}
            onClick={(e) => {
              e.stopPropagation()
              setSnoozeAnchor(e.currentTarget)
            }}
            sx={actionBtnSx}
          >
            <ScheduleIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </span>
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
    </Box>
  )

  return (
    <Box
      className="document-folder-row-rail-wrap"
      onClick={(e) => e.stopPropagation()}
      sx={{
        display: 'flex',
        alignItems: 'stretch',
        position: 'relative',
        width: isTable ? RAIL_ICON_SLOT_WIDTH : 'auto',
        minHeight: isTable ? 48 : 56,
        borderRadius: isTable ? 0 : 2,
        overflow: 'visible',
      }}
    >
      <Box
        className={documentFolderStatusRailZoneClass}
        sx={{
          position: 'relative',
          width: isTable ? '100%' : RAIL_ICON_SLOT_WIDTH,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: isTable ? 48 : 56,
          overflow: 'visible',
        }}
      >
        <Box
          sx={flyoutRowSx}
          onMouseEnter={useDelayedHover ? openControls : undefined}
          onMouseLeave={useDelayedHover ? scheduleCloseControls : undefined}
        >
          <Tooltip title={visual.iconTitle} placement="right">
            <Box
              className="document-folder-status-rail"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                bgcolor: isTable ? alpha(visual.accent, 0.06) : visual.accentMuted,
                position: 'relative',
                cursor: 'default',
                ...(isTable
                  ? {
                      width: RAIL_ICON_SLOT_WIDTH,
                      minHeight: 48,
                    }
                  : {
                      width: '100%',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: DOCUMENT_FOLDER_RAIL_ACCENT_WIDTH,
                        bgcolor: visual.accent,
                      },
                    }),
              }}
            >
              <Box
                role="img"
                aria-label={visual.iconTitle}
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: visual.accent,
                  color: '#fff',
                  animation: `${iconPop} 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both`,
                  boxShadow: unread
                    ? `0 0 0 2px ${alpha('#3b82f6', 0.65)}, 0 0 0 2px ${alpha('#fff', 0.9)}`
                    : `0 0 0 1px ${alpha(visual.accent, 0.35)}`,
                  transition: 'transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transform: panelVisible ? 'scale(1.08)' : 'scale(1)',
                }}
              >
                <Icon sx={{ fontSize: 19 }} />
              </Box>
            </Box>
          </Tooltip>

          {showActions && (
            <Box
              className="document-folder-control-panel"
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 0.35,
                ...(isTable
                  ? hoverRevealSx
                  : {
                      ...hoverRevealSx,
                      position: 'relative',
                      left: 'auto',
                      top: 'auto',
                      transform: 'none',
                      mt: 0.35,
                      ml: 0,
                      opacity: 1,
                      pointerEvents: 'auto',
                      boxShadow: 'none',
                      border: 'none',
                      bgcolor: 'transparent',
                    }),
              }}
            >
              {actionsRow}
              {withTags && tagsSlot && (
                <Box className="document-folder-rail-tags" sx={{ minWidth: 0, maxWidth: panelW - 8 }}>
                  <DocumentTagsEditor
                    layout="inline"
                    tags={tagsSlot.tags}
                    onChange={tagsSlot.onChange}
                    maxVisible={1}
                    savedTags={tagsSlot.savedTags}
                    onRememberTag={tagsSlot.onRememberTag}
                    onRemoveSavedTag={tagsSlot.onRemoveSavedTag}
                    onPopoverOpenChange={setTagsPopoverOpen}
                  />
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}

/** Cellule d’en-tête rail (sans bulk). */
export function DocumentFolderRailTableHeaderCell() {
  return (
    <TableCell
      className={documentFolderRailCellClass}
      sx={getDocumentFolderRailHeaderCellSx()}
    />
  )
}
