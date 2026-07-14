import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  Chip,
  Dialog,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { useNavigate, useLocation } from 'react-router-dom'
import { useBillingUsage } from '../../../hooks/useBillingUsage'
import { useCommandPaletteShortcut } from '../../../hooks/useCommandPaletteShortcut'
import { useCommandPaletteEntitySearch } from '../../../hooks/useCommandPaletteEntitySearch'
import { demoService } from '../../../services/demoService'
import { trackGoogleAnalyticsEvent } from '../../../utils/googleAnalytics'
import { GA_EVENTS } from '../../../config/analyticsEvents'
import {
  createNavSettingsGroup,
  filterNavGroups,
  navGroups,
  navPlanFilterFromUsage,
} from '../config/navConfig'
import { settingsNavFilterFromUsage } from '../../account/settingsNav'
import {
  buildCommandPaletteItems,
  buildContextualPaletteItems,
  COMMAND_PALETTE_ZERO_RESULT_SUGGESTIONS,
  filterCommandPaletteItems,
  groupCommandPaletteItems,
  mergeCommandPaletteItems,
  sortCommandPaletteItemsForDisplay,
  type CommandPaletteItem,
} from '../config/commandPaletteConfig'

type CommandPaletteProps = {
  /** Ouvre la palette depuis un bouton externe (toolbar). */
  open?: boolean
  /** Callback de fermeture (mode contrôlé). */
  onClose?: () => void
}

/**
 * Palette globale Cmd+K : recherche pages, actions rapides et réglages.
 */
export function CommandPalette({ open: controlledOpen, onClose: controlledOnClose }: CommandPaletteProps) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const navigate = useNavigate()
  const location = useLocation()
  const { usage } = useBillingUsage()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const [internalOpen, setInternalOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  const planFilter = navPlanFilterFromUsage(usage)
  const visibleNavGroups = filterNavGroups(navGroups, planFilter)
  const settingsGroup = createNavSettingsGroup(settingsNavFilterFromUsage(usage))

  const allItems = useMemo(
    () => buildCommandPaletteItems({ navGroups: visibleNavGroups, settingsGroup }),
    [visibleNavGroups, settingsGroup],
  )

  const contextualItems = useMemo(
    () =>
      buildContextualPaletteItems(location.pathname, {
        isDemo: demoService.isDemoSession(),
      }),
    [location.pathname],
  )

  const { items: entityItems, loading: entityLoading } = useCommandPaletteEntitySearch(query, open)

  const filteredItems = useMemo(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      const sorted = sortCommandPaletteItemsForDisplay(allItems, query)
      const contextualTos = new Set(contextualItems.map((item) => item.to))
      return [...contextualItems, ...sorted.filter((item) => !contextualTos.has(item.to))]
    }

    const merged = mergeCommandPaletteItems(entityItems, allItems)
    const base = filterCommandPaletteItems(merged, query)
    if (base.length === 0) return COMMAND_PALETTE_ZERO_RESULT_SUGGESTIONS
    return base
  }, [allItems, contextualItems, entityItems, query])

  const groupedItems = useMemo(() => groupCommandPaletteItems(filteredItems), [filteredItems])
  const isZeroResultFallback =
    query.trim().length > 0 &&
    filterCommandPaletteItems(mergeCommandPaletteItems(entityItems, allItems), query).length === 0

  const handleClose = useCallback(() => {
    if (isControlled) {
      controlledOnClose?.()
    } else {
      setInternalOpen(false)
    }
    setQuery('')
    setSelectedIndex(0)
  }, [controlledOnClose, isControlled])

  const handleOpen = useCallback(() => {
    if (isControlled) return
    setInternalOpen(true)
    trackGoogleAnalyticsEvent(GA_EVENTS.COMMAND_PALETTE_OPEN)
  }, [isControlled])

  useCommandPaletteShortcut(handleOpen, !isControlled && !open)

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50)
    return () => window.clearTimeout(timer)
  }, [open])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    if (!open || !listRef.current) return
    const selected = listRef.current.querySelector('[data-selected="true"]')
    selected?.scrollIntoView({ block: 'nearest' })
  }, [open, selectedIndex])

  const selectItem = useCallback(
    (item: CommandPaletteItem) => {
      trackGoogleAnalyticsEvent(GA_EVENTS.COMMAND_PALETTE_SELECT, {
        destination: item.to,
        item_kind: item.kind,
        plan_locked: item.planLocked === true,
      })
      handleClose()
      navigate(item.to)
    },
    [handleClose, navigate],
  )

  const handleDialogKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      handleClose()
      return
    }

    if (filteredItems.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length)
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      const item = filteredItems[selectedIndex]
      if (item) selectItem(item)
    }
  }

  let flatIndex = -1

  const shortcutLabel = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.platform)
    ? '⌘K'
    : 'Ctrl+K'

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            bgcolor: isDark ? alpha('#0c1222', 0.98) : '#fff',
            border: '1px solid',
            borderColor: isDark ? alpha('#fff', 0.08) : alpha('#0f172a', 0.08),
            boxShadow: isDark
              ? `0 24px 48px ${alpha('#000', 0.45)}`
              : `0 24px 48px ${alpha('#0f172a', 0.12)}`,
          },
        },
      }}
    >
      <Box onKeyDown={handleDialogKeyDown} sx={{ display: 'flex', flexDirection: 'column' }}>
        <TextField
          inputRef={inputRef}
          fullWidth
          placeholder="N° facture, client, ou action…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          aria-label="Recherche rapide"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              sx: {
                py: 1.5,
                px: 2,
                fontSize: '1rem',
                '& fieldset': { border: 'none' },
              },
            },
          }}
        />

        <Box
          sx={{
            maxHeight: 360,
            overflowY: 'auto',
            borderTop: '1px solid',
            borderColor: isDark ? alpha('#fff', 0.06) : alpha('#0f172a', 0.06),
          }}
        >
          {!query.trim() ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 2.5, pt: 1.5, pb: 0.25 }}>
              Actions populaires — tapez pour filtrer
            </Typography>
          ) : null}
          {isZeroResultFallback ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 2.5, pt: 1.5, pb: 0.5 }}>
              Aucun résultat pour « {query.trim()} » — suggestions :
            </Typography>
          ) : null}
          {entityLoading && query.trim().length >= 2 ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 2.5, pt: 1, pb: 0.5 }}>
              Recherche factures et clients…
            </Typography>
          ) : null}
          {filteredItems.length === 0 ? (
            <Box sx={{ px: 3, py: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Aucun résultat pour « {query.trim()} »
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Essayez « facture », « client » ou « paramètres »
              </Typography>
            </Box>
          ) : (
            <List dense disablePadding ref={listRef} sx={{ py: 1 }}>
              {groupedItems.map((group) => (
                <Box key={group.groupLabel}>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      px: 2.5,
                      pt: 1.5,
                      pb: 0.5,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: 'text.secondary',
                      fontSize: '0.65rem',
                    }}
                  >
                    {group.groupLabel}
                  </Typography>
                  {group.items.map((item) => {
                    flatIndex += 1
                    const isSelected = flatIndex === selectedIndex
                    return (
                      <ListItemButton
                        key={item.id}
                        data-selected={isSelected ? 'true' : undefined}
                        selected={isSelected}
                        onClick={() => selectItem(item)}
                        sx={{
                          mx: 1,
                          borderRadius: 2,
                          py: 1,
                          opacity: item.planLocked ? 0.85 : 1,
                        }}
                      >
                        {item.icon ? (
                          <ListItemIcon sx={{ minWidth: 36, color: item.planLocked ? '#b45309' : 'text.secondary' }}>
                            {item.icon}
                          </ListItemIcon>
                        ) : null}
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" fontWeight={600} noWrap>
                                {item.label}
                              </Typography>
                              {item.badge ? (
                                <Chip label={item.badge} size="small" sx={{ height: 20, fontSize: '0.65rem' }} />
                              ) : null}
                              {item.planLocked ? (
                                <LockOutlinedIcon sx={{ fontSize: 14, color: '#b45309' }} />
                              ) : null}
                            </Box>
                          }
                          secondary={item.description}
                          secondaryTypographyProps={{ noWrap: true, fontSize: '0.75rem' }}
                        />
                      </ListItemButton>
                    )
                  })}
                </Box>
              ))}
            </List>
          )}
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2.5,
            py: 1.25,
            borderTop: '1px solid',
            borderColor: isDark ? alpha('#fff', 0.06) : alpha('#0f172a', 0.06),
            bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#0f172a', 0.02),
          }}
        >
          <Typography variant="caption" color="text.secondary">
            ↑↓ naviguer · Entrée ouvrir · Échap fermer
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontFamily: 'monospace',
              fontWeight: 600,
              px: 1,
              py: 0.25,
              borderRadius: 1,
              bgcolor: isDark ? alpha('#fff', 0.06) : alpha('#0f172a', 0.06),
            }}
          >
            {shortcutLabel}
          </Typography>
        </Box>
      </Box>
    </Dialog>
  )
}

/**
 * Bouton d'ouverture palette pour la barre d'outils (mode contrôlé).
 */
export function CommandPaletteHost() {
  const [open, setOpen] = useState(false)

  const openPalette = useCallback((source: 'toolbar' | 'shortcut') => {
    setOpen(true)
    trackGoogleAnalyticsEvent(GA_EVENTS.COMMAND_PALETTE_OPEN, { source })
  }, [])

  useCommandPaletteShortcut(() => openPalette('shortcut'), !open)

  const toolbarShortcut =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.platform) ? '⌘K' : 'Ctrl+K'

  return (
    <>
      <CommandPalette open={open} onClose={() => setOpen(false)} />
      <Tooltip title={`Recherche rapide (${toolbarShortcut})`}>
        <Box
          component="button"
          type="button"
          onClick={() => openPalette('toolbar')}
          aria-label="Recherche rapide"
          sx={{
            display: { xs: 'none', sm: 'inline-flex' },
            alignItems: 'center',
            gap: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            px: 1.5,
            py: 0.5,
            bgcolor: 'transparent',
            color: 'text.secondary',
            cursor: 'pointer',
            font: 'inherit',
            fontSize: '0.8125rem',
            '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
          }}
        >
          <SearchIcon sx={{ fontSize: 18 }} />
          <Typography variant="caption" sx={{ display: { sm: 'none', md: 'inline' } }}>
            Rechercher…
          </Typography>
        </Box>
      </Tooltip>
    </>
  )
}
