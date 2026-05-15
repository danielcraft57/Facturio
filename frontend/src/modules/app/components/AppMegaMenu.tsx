import { useRef, useState, useCallback } from 'react'
import {
  Box,
  Button,
  Chip,
  ClickAwayListener,
  Fade,
  Paper,
  Popper,
  Typography,
  alpha,
  useTheme,
} from '@mui/material'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import type { NavGroup, NavItem } from '../config/navConfig'
import { isGroupActive, isNavActive } from '../config/navConfig'

const ACCENT: Record<string, { bg: string; fg: string; glow: string }> = {
  navy: {
    bg: 'linear-gradient(145deg, #0f172a 0%, #1e3a5f 100%)',
    fg: '#e2e8f0',
    glow: 'rgba(30, 58, 95, 0.35)',
  },
  emerald: {
    bg: 'linear-gradient(145deg, #064e3b 0%, #047857 100%)',
    fg: '#d1fae5',
    glow: 'rgba(4, 120, 87, 0.35)',
  },
  amber: {
    bg: 'linear-gradient(145deg, #78350f 0%, #b45309 100%)',
    fg: '#fef3c7',
    glow: 'rgba(180, 83, 9, 0.35)',
  },
}

function MegaMenuItem({
  item,
  selected,
  onNavigate,
}: {
  item: NavItem
  selected: boolean
  onNavigate: () => void
}) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  return (
    <Box
      component={RouterLink}
      to={item.to}
      onClick={onNavigate}
      sx={{
        display: 'flex',
        gap: 1.5,
        p: 1.5,
        borderRadius: 2,
        textDecoration: 'none',
        color: 'text.primary',
        border: '1px solid transparent',
        transition: 'all 0.2s ease',
        bgcolor: selected
          ? alpha(theme.palette.primary.main, isDark ? 0.2 : 0.08)
          : 'transparent',
        borderColor: selected ? alpha(theme.palette.primary.main, 0.35) : 'transparent',
        '&:hover': {
          bgcolor: alpha(theme.palette.primary.main, isDark ? 0.14 : 0.06),
          borderColor: alpha(theme.palette.primary.main, 0.2),
          transform: 'translateY(-1px)',
          boxShadow: isDark ? 'none' : `0 8px 24px ${alpha('#0f172a', 0.06)}`,
        },
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          bgcolor: isDark ? alpha('#fff', 0.06) : alpha('#0f172a', 0.05),
          color: selected ? 'primary.main' : 'text.secondary',
        }}
      >
        {item.icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" fontWeight={600} noWrap>
            {item.label}
          </Typography>
          {item.badge && (
            <Chip
              label={item.badge}
              size="small"
              sx={{
                height: 18,
                fontSize: '0.65rem',
                fontWeight: 700,
                bgcolor: alpha('#b45309', 0.12),
                color: '#b45309',
              }}
            />
          )}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.35 }}>
          {item.description}
        </Typography>
      </Box>
    </Box>
  )
}

export function AppMegaMenu({ group }: { group: NavGroup }) {
  const theme = useTheme()
  const location = useLocation()
  const isDark = theme.palette.mode === 'dark'
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLButtonElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const active = isGroupActive(location.pathname, group)
  const accent = ACCENT[group.featured.accent] ?? ACCENT.navy

  const handleEnter = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpen(true)
  }, [])

  const handleLeave = useCallback(() => {
    closeTimer.current = setTimeout(() => setOpen(false), 120)
  }, [])

  const close = () => setOpen(false)

  return (
    <Box onMouseEnter={handleEnter} onMouseLeave={handleLeave} sx={{ position: 'relative' }}>
      <Button
        ref={anchorRef}
        onClick={() => setOpen((v) => !v)}
        endIcon={
          <KeyboardArrowDownIcon
            sx={{
              fontSize: 18,
              transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: open ? 'rotate(180deg)' : 'none',
              opacity: 0.7,
            }}
          />
        }
        sx={{
          color: 'inherit',
          fontWeight: active ? 600 : 500,
          fontSize: '0.9375rem',
          textTransform: 'none',
          px: 1.25,
          py: 0.75,
          minHeight: 40,
          borderRadius: 1.5,
          letterSpacing: '-0.01em',
          bgcolor: open || active ? alpha(theme.palette.primary.main, isDark ? 0.12 : 0.06) : 'transparent',
          boxShadow: open ? `inset 0 -2px 0 ${theme.palette.primary.main}` : 'none',
          '&:hover': {
            bgcolor: alpha(theme.palette.primary.main, isDark ? 0.1 : 0.05),
          },
        }}
      >
        {group.label}
      </Button>

      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        transition
        sx={{ zIndex: theme.zIndex.modal + 2 }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={220}>
            <Box>
              <ClickAwayListener onClickAway={close}>
                <Paper
                  elevation={0}
                  onMouseEnter={handleEnter}
                  onMouseLeave={handleLeave}
                  sx={{
                    mt: 1.5,
                    width: { md: 680, lg: 760, xl: 820 },
                    maxWidth: 'calc(100vw - 48px)',
                    borderRadius: 3,
                    overflow: 'hidden',
                    border: `1px solid ${alpha(isDark ? '#fff' : '#0f172a', isDark ? 0.1 : 0.08)}`,
                    boxShadow: isDark
                      ? `0 24px 80px ${alpha('#000', 0.55)}, 0 0 0 1px ${alpha('#fff', 0.05)}`
                      : `0 24px 64px ${alpha('#0f172a', 0.12)}, 0 8px 24px ${alpha('#0f172a', 0.06)}`,
                    bgcolor: isDark ? alpha('#0f1419', 0.98) : '#ffffff',
                    backdropFilter: 'blur(16px)',
                  }}
                >
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: '200px 1fr 200px' },
                      minHeight: 280,
                    }}
                  >
                    {/* Colonne intro — style Finch / Bloxs */}
                    <Box
                      sx={{
                        p: 2.5,
                        borderRight: { md: `1px solid ${theme.palette.divider}` },
                        bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#f8fafc', 1),
                      }}
                    >
                      <Typography
                        variant="overline"
                        sx={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          letterSpacing: '0.12em',
                          color: 'text.secondary',
                        }}
                      >
                        {group.label}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          mt: 1,
                          mb: 2,
                          fontWeight: 500,
                          lineHeight: 1.55,
                          color: 'text.secondary',
                          fontSize: '0.8125rem',
                        }}
                      >
                        {group.overview}
                      </Typography>
                      {group.overviewCta && (
                        <Button
                          variant="outlined"
                          size="small"
                          component={RouterLink}
                          to={group.overviewCta.to}
                          endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                          onClick={close}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.8125rem',
                            alignSelf: 'flex-start',
                            borderRadius: 2,
                            borderColor: isDark ? alpha('#93c5fd', 0.5) : alpha('#1e40af', 0.4),
                            color: isDark ? '#93c5fd' : '#1e40af',
                            bgcolor: isDark ? alpha('#3b82f6', 0.08) : alpha('#1e40af', 0.04),
                            '&:hover': {
                              borderColor: isDark ? '#93c5fd' : '#1e40af',
                              bgcolor: isDark ? alpha('#3b82f6', 0.16) : alpha('#1e40af', 0.08),
                            },
                          }}
                        >
                          {group.overviewCta.label}
                        </Button>
                      )}
                    </Box>

                    {/* Grille modules */}
                    <Box
                      sx={{
                        p: 2,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: 0.5,
                        alignContent: 'start',
                      }}
                    >
                      {group.items.map((item) => (
                        <MegaMenuItem
                          key={item.to}
                          item={item}
                          selected={isNavActive(location.pathname, item.to)}
                          onNavigate={close}
                        />
                      ))}
                    </Box>

                    {/* Carte mise en avant */}
                    <Box
                      component={RouterLink}
                      to={group.featured.to}
                      onClick={close}
                      sx={{
                        p: 2.5,
                        m: { xs: 2, md: 2 },
                        mt: { xs: 0, md: 2 },
                        borderRadius: 2.5,
                        textDecoration: 'none',
                        color: accent.fg,
                        background: accent.bg,
                        boxShadow: `0 12px 40px ${accent.glow}`,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: { xs: 140, md: 'auto' },
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 16px 48px ${accent.glow}`,
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: 2,
                          bgcolor: alpha('#fff', 0.12),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 2,
                        }}
                      >
                        {group.featured.icon}
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'inherit', mb: 0.5 }}>
                          {group.featured.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: alpha('#fff', 0.75), lineHeight: 1.45, display: 'block', mb: 2 }}>
                          {group.featured.description}
                        </Typography>
                        <Chip
                          label={group.featured.cta}
                          size="small"
                          sx={{
                            bgcolor: alpha('#fff', 0.15),
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            '& .MuiChip-label': { px: 1.25 },
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              </ClickAwayListener>
            </Box>
          </Fade>
        )}
      </Popper>
    </Box>
  )
}
