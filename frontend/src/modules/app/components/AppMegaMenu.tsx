import { useEffect, useRef, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  ClickAwayListener,
  Divider,
  Fade,
  Paper,
  Popper,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import type { NavFeatured, NavGroup, NavItem } from '../config/navConfig'
import { isGroupActive, isNavActive } from '../config/navConfig'
import { topNavItemSx } from './topNavItemStyles'

const ACCENT: Record<string, { bg: string; fg: string; glow: string; btn: string }> = {
  navy: {
    bg: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 55%, #1e40af 100%)',
    fg: '#f1f5f9',
    glow: 'rgba(30, 58, 95, 0.28)',
    btn: alpha('#fff', 0.18),
  },
  emerald: {
    bg: 'linear-gradient(135deg, #064e3b 0%, #047857 55%, #059669 100%)',
    fg: '#ecfdf5',
    glow: 'rgba(4, 120, 87, 0.28)',
    btn: alpha('#fff', 0.18),
  },
  amber: {
    bg: 'linear-gradient(135deg, #78350f 0%, #b45309 55%, #d97706 100%)',
    fg: '#fffbeb',
    glow: 'rgba(180, 83, 9, 0.28)',
    btn: alpha('#fff', 0.18),
  },
}

function MenuSectionLabel({ children, sx }: { children: string; sx?: object }) {
  return (
    <Box sx={{ gridColumn: '1 / -1', px: 0.5, pt: 1.25, pb: 0.25, ...sx }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'text.secondary',
          fontSize: '0.65rem',
        }}
      >
        {children}
      </Typography>
    </Box>
  )
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
  const emphasis = item.emphasis === true && !selected

  return (
    <Box
      component={RouterLink}
      to={item.to}
      onClick={onNavigate}
      sx={{
        display: 'flex',
        gap: 1.25,
        p: 1.25,
        minHeight: 56,
        borderRadius: 2,
        textDecoration: 'none',
        color: 'text.primary',
        border: '1px solid',
        borderColor: selected
          ? alpha(theme.palette.primary.main, 0.4)
          : emphasis
            ? alpha(theme.palette.success.main, isDark ? 0.35 : 0.22)
            : 'transparent',
        transition: 'background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
        bgcolor: selected
          ? alpha(theme.palette.primary.main, isDark ? 0.18 : 0.07)
          : emphasis
            ? alpha(theme.palette.success.main, isDark ? 0.08 : 0.04)
            : 'transparent',
        '&:hover': {
          bgcolor: alpha(theme.palette.primary.main, isDark ? 0.14 : 0.05),
          borderColor: alpha(theme.palette.primary.main, 0.25),
          boxShadow: isDark ? 'none' : `0 4px 16px ${alpha('#0f172a', 0.06)}`,
        },
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          bgcolor: selected
            ? alpha(theme.palette.primary.main, isDark ? 0.25 : 0.1)
            : isDark
              ? alpha('#fff', 0.06)
              : alpha('#0f172a', 0.05),
          color: selected ? 'primary.main' : emphasis ? 'success.dark' : 'text.secondary',
        }}
      >
        {item.icon}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
          <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.3 }}>
            {item.label}
          </Typography>
          {item.badge && (
            <Chip
              label={item.badge}
              size="small"
              sx={{
                height: 18,
                fontSize: '0.62rem',
                fontWeight: 700,
                bgcolor: alpha('#b45309', 0.12),
                color: '#b45309',
              }}
            />
          )}
        </Box>
        {item.description && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.35,
              mt: 0.25,
            }}
          >
            {item.description}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

function MegaMenuFeatured({
  featured,
  accentKey,
  horizontal,
  pathname,
  onNavigate,
}: {
  featured: NavFeatured
  accentKey: string
  horizontal: boolean
  pathname: string
  onNavigate: () => void
}) {
  const accent = ACCENT[accentKey] ?? ACCENT.navy
  const primaryActive = isNavActive(pathname, featured.to)
  const secondaryActive = featured.secondaryCta
    ? isNavActive(pathname, featured.secondaryCta.to)
    : false

  const ctaButtonSx = (active: boolean) => ({
    textTransform: 'none' as const,
    fontWeight: 600,
    fontSize: '0.75rem',
    borderRadius: 1.5,
    ...(active
      ? {
          bgcolor: accent.btn,
          color: accent.fg,
          boxShadow: 'none',
          '&:hover': { bgcolor: alpha('#fff', 0.28), boxShadow: 'none' },
        }
      : {
          borderColor: alpha('#fff', 0.45),
          color: accent.fg,
          '&:hover': { borderColor: '#fff', bgcolor: alpha('#fff', 0.1) },
        }),
  })

  const ctas = (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: horizontal ? 0 : 1.5 }}>
      <Button
        component={RouterLink}
        to={featured.to}
        onClick={onNavigate}
        size="small"
        variant={primaryActive || !secondaryActive ? 'contained' : 'outlined'}
        sx={ctaButtonSx(primaryActive || !secondaryActive)}
      >
        {featured.cta}
      </Button>
      {featured.secondaryCta && (
        <Button
          component={RouterLink}
          to={featured.secondaryCta.to}
          onClick={onNavigate}
          size="small"
          variant={secondaryActive ? 'contained' : 'outlined'}
          sx={ctaButtonSx(secondaryActive)}
        >
          {featured.secondaryCta.label}
        </Button>
      )}
    </Box>
  )

  if (horizontal) {
    return (
      <Box
        sx={{
          mx: 2,
          mb: 2,
          p: 2,
          borderRadius: 2.5,
          color: accent.fg,
          background: accent.bg,
          boxShadow: `0 8px 32px ${accent.glow}`,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: alpha('#fff', 0.12),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {featured.icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'inherit' }}>
            {featured.title}
          </Typography>
          <Typography variant="caption" sx={{ color: alpha('#fff', 0.8), lineHeight: 1.4 }}>
            {featured.description}
          </Typography>
        </Box>
        {ctas}
      </Box>
    )
  }

  return (
    <Box
      sx={{
        p: 2.25,
        m: 2,
        ml: { lg: 0 },
        mr: { lg: 2 },
        mt: { lg: 2 },
        mb: { lg: 2 },
        borderRadius: 2.5,
        color: accent.fg,
        background: accent.bg,
        boxShadow: `0 10px 36px ${accent.glow}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: 200,
        textDecoration: 'none',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: `0 14px 44px ${accent.glow}`,
        },
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2,
          bgcolor: alpha('#fff', 0.12),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 1.5,
        }}
      >
        {featured.icon}
      </Box>
      <Box>
        <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'inherit', mb: 0.5 }}>
          {featured.title}
        </Typography>
        <Typography variant="caption" sx={{ color: alpha('#fff', 0.78), lineHeight: 1.45, display: 'block', mb: 0.5 }}>
          {featured.description}
        </Typography>
        {ctas}
      </Box>
    </Box>
  )
}

export function AppMegaMenu({ group }: { group: NavGroup }) {
  const theme = useTheme()
  const location = useLocation()
  const isDark = theme.palette.mode === 'dark'
  const isDesktopPanel = useMediaQuery(theme.breakpoints.up('lg'))
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLButtonElement>(null)
  const active = isGroupActive(location.pathname, group)
  const highlighted = open || active

  const close = () => setOpen(false)
  const toggleMenu = () => setOpen((v) => !v)

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  const financeEncoursLabelAt = group.id === 'finance' ? 0 : -1
  const financeFiscalLabelAt = group.id === 'finance' ? 2 : -1

  return (
    <Box sx={{ position: 'relative' }}>
      <Button
        ref={anchorRef}
        onClick={toggleMenu}
        disableRipple
        aria-expanded={open}
        aria-haspopup="true"
        endIcon={
          <KeyboardArrowDownIcon
            sx={{
              fontSize: 18,
              transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: open ? 'rotate(180deg)' : 'none',
              opacity: highlighted ? 1 : 0.7,
            }}
          />
        }
        sx={topNavItemSx(theme, highlighted)}
      >
        {group.label}
      </Button>

      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        transition
        modifiers={[{ name: 'offset', options: { offset: [0, 10] } }]}
        sx={{ zIndex: theme.zIndex.modal + 2 }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={180}>
            <Box>
              <ClickAwayListener
                onClickAway={(event) => {
                  if (anchorRef.current?.contains(event.target as Node)) return
                  close()
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    width: { md: 'min(720px, calc(100vw - 32px))', lg: 780, xl: 840 },
                    maxWidth: 'calc(100vw - 24px)',
                    borderRadius: 2.5,
                    overflow: 'hidden',
                    border: `1px solid ${alpha(isDark ? '#fff' : '#0f172a', isDark ? 0.1 : 0.07)}`,
                    boxShadow: isDark
                      ? `0 20px 60px ${alpha('#000', 0.5)}`
                      : `0 20px 50px ${alpha('#0f172a', 0.1)}, 0 4px 12px ${alpha('#0f172a', 0.04)}`,
                    bgcolor: isDark ? alpha('#0f1419', 0.98) : '#ffffff',
                  }}
                >
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: isDesktopPanel
                        ? 'minmax(176px, 200px) minmax(0, 1fr) minmax(200px, 220px)'
                        : '1fr',
                      gridTemplateRows: isDesktopPanel ? '1fr' : 'auto auto auto',
                      maxHeight: isDesktopPanel ? 'none' : 'min(70vh, 520px)',
                      overflow: isDesktopPanel ? 'visible' : 'auto',
                    }}
                  >
                    {/* Intro */}
                    <Box
                      sx={{
                        p: 2,
                        borderRight: isDesktopPanel ? `1px solid ${theme.palette.divider}` : 'none',
                        borderBottom: isDesktopPanel ? 'none' : `1px solid ${theme.palette.divider}`,
                        bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#f8fafc', 1),
                        display: 'flex',
                        flexDirection: isDesktopPanel ? 'column' : { xs: 'column', sm: 'row' },
                        alignItems: isDesktopPanel ? 'stretch' : { sm: 'center' },
                        justifyContent: 'space-between',
                        gap: 1.5,
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="overline"
                          sx={{
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            letterSpacing: '0.14em',
                            color: 'text.secondary',
                            lineHeight: 1.2,
                          }}
                        >
                          {group.label}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            mt: 0.75,
                            fontWeight: 500,
                            lineHeight: 1.5,
                            color: 'text.secondary',
                            fontSize: '0.8125rem',
                            maxWidth: isDesktopPanel ? 'none' : { sm: 420 },
                          }}
                        >
                          {group.overview}
                        </Typography>
                      </Box>
                      {group.overviewCta && (
                        <Button
                          variant="text"
                          size="small"
                          component={RouterLink}
                          to={group.overviewCta.to}
                          endIcon={<ArrowForwardIcon sx={{ fontSize: 15 }} />}
                          onClick={close}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.8125rem',
                            alignSelf: isDesktopPanel ? 'flex-start' : { sm: 'center' },
                            flexShrink: 0,
                            color: 'primary.main',
                            px: 0.5,
                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) },
                          }}
                        >
                          {group.overviewCta.label}
                        </Button>
                      )}
                    </Box>

                    {/* Liens */}
                    <Box
                      sx={{
                        p: 1.75,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                        gap: 0.75,
                        alignContent: 'start',
                        borderBottom: isDesktopPanel ? 'none' : `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      {group.items.map((item, index) => (
                        <Box key={item.to} sx={{ display: 'contents' }}>
                          {financeEncoursLabelAt === index && (
                            <MenuSectionLabel>Encours</MenuSectionLabel>
                          )}
                          {financeFiscalLabelAt === index && (
                            <>
                              <MenuSectionLabel sx={{ pt: 2 }}>Fiscalité &amp; compta</MenuSectionLabel>
                              <Divider sx={{ gridColumn: '1 / -1', my: 0.25 }} />
                            </>
                          )}
                          <MegaMenuItem
                            item={item}
                            selected={isNavActive(location.pathname, item.to)}
                            onNavigate={close}
                          />
                        </Box>
                      ))}
                    </Box>

                    {/* Carte — colonne droite (desktop) ou bandeau (tablette) */}
                    <Box sx={{ gridColumn: isDesktopPanel ? undefined : '1 / -1' }}>
                      <MegaMenuFeatured
                        featured={group.featured}
                        accentKey={group.featured.accent}
                        horizontal={!isDesktopPanel}
                        pathname={location.pathname}
                        onNavigate={close}
                      />
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
