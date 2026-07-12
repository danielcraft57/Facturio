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
  keyframes,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import type { NavFeatured, NavGroup, NavItem } from '../config/navConfig'
import { isGroupActive, isNavActive } from '../config/navConfig'
import { topNavItemSx } from './topNavItemStyles'
import { prefetchFinanceRouteFromPath } from '../../../utils/prefetchFinanceRoutes'
import { ProPlanBadge } from '../../../components/billing/ProPlanBadge'
import { SettingsMegaMenuColumns } from './SettingsMegaMenuColumns'

/** Au-dessus de l’AppBar (drawer+2) et des panneaux latéraux. */
const MEGA_MENU_Z_INDEX = 1500

const menuReveal = keyframes`
  0% { opacity: 0; transform: translateY(-10px) scale(0.98); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
`

const itemStagger = keyframes`
  0% { opacity: 0; transform: translateX(-8px); }
  100% { opacity: 1; transform: translateX(0); }
`

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
  staggerIndex = 0,
  menuOpen,
  compact = false,
}: {
  item: NavItem
  selected: boolean
  onNavigate: () => void
  staggerIndex?: number
  menuOpen: boolean
  compact?: boolean
}) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  return (
    <Box
      component={RouterLink}
      to={item.to}
      onClick={onNavigate}
      onMouseEnter={() => prefetchFinanceRouteFromPath(item.to)}
      onFocus={() => prefetchFinanceRouteFromPath(item.to)}
      sx={{
        display: 'flex',
        gap: compact ? 0.75 : 1.25,
        p: compact ? 0.75 : 1.25,
        minHeight: compact ? 40 : 56,
        borderRadius: 2,
        textDecoration: 'none',
        color: 'text.primary',
        border: '1px solid',
        borderColor: selected ? alpha(theme.palette.primary.main, 0.45) : 'transparent',
        opacity: item.planLocked ? 0.72 : 1,
        transition:
          'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
        bgcolor: selected ? alpha(theme.palette.primary.main, isDark ? 0.18 : 0.07) : 'transparent',
        animation: menuOpen
          ? `${itemStagger} 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) ${staggerIndex * 45}ms both`
          : 'none',
        '&:hover': {
          bgcolor: alpha(theme.palette.primary.main, isDark ? 0.14 : 0.05),
          borderColor: alpha(theme.palette.primary.main, 0.28),
          transform: 'translateX(4px)',
          boxShadow: isDark ? 'none' : `0 6px 20px ${alpha('#0f172a', 0.08)}`,
          '& .mega-menu-item-icon': {
            transform: 'scale(1.08)',
            bgcolor: alpha(theme.palette.primary.main, isDark ? 0.22 : 0.12),
          },
        },
      }}
    >
      <Box
        className="mega-menu-item-icon"
        sx={{
          width: compact ? 28 : 36,
          height: compact ? 28 : 36,
          borderRadius: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s ease',
          bgcolor: selected
            ? alpha(theme.palette.primary.main, isDark ? 0.25 : 0.1)
            : item.planLocked
              ? alpha('#b45309', isDark ? 0.18 : 0.1)
              : isDark
                ? alpha('#fff', 0.06)
                : alpha('#0f172a', 0.05),
          color: selected ? 'primary.main' : item.planLocked ? '#b45309' : 'text.secondary',
        }}
      >
        {item.icon}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{ lineHeight: 1.3, fontSize: compact ? '0.8125rem' : undefined }}
          >
            {item.label}
          </Typography>
          {item.badge === 'Pro' ? (
            <ProPlanBadge />
          ) : item.badge ? (
            <Chip
              label={item.badge}
              size="small"
              sx={{
                height: compact ? 16 : 18,
                fontSize: '0.62rem',
                fontWeight: 700,
                bgcolor: alpha('#b45309', 0.12),
                color: '#b45309',
              }}
            />
          ) : null}
        </Box>
        {item.description && !compact && (
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
  menuOpen,
  planLocked = false,
}: {
  featured: NavFeatured
  accentKey: string
  horizontal: boolean
  pathname: string
  onNavigate: () => void
  menuOpen: boolean
  /** Fonctionnalité Pro : navigation vers aperçu + CTA upgrade. */
  planLocked?: boolean
}) {
  const accent = ACCENT[accentKey] ?? ACCENT.navy
  const navigate = useNavigate()
  const primaryActive = isNavActive(pathname, featured.to)
  const primaryCtaLabel = planLocked ? "Voir l'aperçu" : featured.cta
  const secondaryCta = planLocked
    ? { label: 'Passer Pro', to: '/parametres/abonnement' }
    : featured.secondaryCta
  const description = planLocked
    ? `${featured.description} — inclus dans Pro, aperçu disponible.`
    : featured.description

  const handleFeaturedNav = (to: string) => {
    onNavigate()
    navigate(to)
  }

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
        onClick={() => handleFeaturedNav(featured.to)}
        size="small"
        variant="contained"
        sx={ctaButtonSx(primaryActive)}
      >
        {primaryCtaLabel}
      </Button>
      {secondaryCta && (
        <Button
          onClick={() => handleFeaturedNav(secondaryCta.to)}
          size="small"
          variant="outlined"
          sx={ctaButtonSx(isNavActive(pathname, secondaryCta.to))}
        >
          {secondaryCta.label}
        </Button>
      )}
    </Box>
  )

  const cardSx = {
    borderRadius: 2.5,
    color: accent.fg,
    background: accent.bg,
    animation: menuOpen ? `${menuReveal} 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.08s both` : 'none',
    transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: `0 16px 48px ${accent.glow}`,
    },
  }

  if (horizontal) {
    return (
      <Box
        sx={{
          ...cardSx,
          mx: 2,
          mb: 2,
          p: 2,
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mb: 0.25 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'inherit' }}>
              {featured.title}
            </Typography>
            {planLocked ? <ProPlanBadge /> : null}
          </Box>
          <Typography variant="caption" sx={{ color: alpha('#fff', 0.8), lineHeight: 1.4 }}>
            {description}
          </Typography>
        </Box>
        {ctas}
      </Box>
    )
  }

  return (
    <Box
      sx={{
        ...cardSx,
        p: 2.25,
        m: 2,
        ml: { lg: 0 },
        mr: { lg: 2 },
        mt: { lg: 2 },
        mb: { lg: 2 },
        boxShadow: `0 10px 36px ${accent.glow}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: horizontal ? 200 : 160,
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mb: 0.5 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'inherit' }}>
            {featured.title}
          </Typography>
          {planLocked ? <ProPlanBadge /> : null}
        </Box>
        <Typography
          variant="caption"
          sx={{
            color: alpha('#fff', 0.78),
            lineHeight: 1.45,
            display: 'block',
            mb: 0.5,
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {description}
        </Typography>
        {ctas}
      </Box>
    </Box>
  )
}

type MenuSections = {
  activity: NavItem[]
  encours: NavItem[]
  compte: NavItem[]
  facturation: NavItem[]
  donnees: NavItem[]
  api: NavItem[]
  other: NavItem[]
}

function groupItemsBySection(group: NavGroup): MenuSections {
  const empty: MenuSections = {
    activity: [],
    encours: [],
    compte: [],
    facturation: [],
    donnees: [],
    api: [],
    other: [],
  }

  if (group.id === 'commercial') {
    for (const item of group.items) {
      if (item.section === 'encours') empty.encours.push(item)
      else empty.activity.push(item)
    }
    return empty
  }

  if (group.id === 'parametres') {
    for (const item of group.items) {
      if (item.section === 'compte') empty.compte.push(item)
      else if (item.section === 'facturation') empty.facturation.push(item)
      else if (item.section === 'donnees') empty.donnees.push(item)
      else if (item.section === 'api') empty.api.push(item)
      else empty.compte.push(item)
    }
    return empty
  }

  empty.other = group.items
  return empty
}

/**
 * Indique si la carte mise en avant du groupe est verrouillée par le plan.
 *
 * @param group - Groupe de navigation (items déjà annotés planLocked)
 */
function isFeaturedPlanLocked(group: NavGroup): boolean {
  const match = group.items.find((item) => item.to === group.featured.to)
  return match?.planLocked === true
}

function renderMenuItems(
  items: NavItem[],
  pathname: string,
  close: () => void,
  menuOpen: boolean,
  startIndex: number,
  compact = false,
) {
  return items.map((item, i) => (
    <MegaMenuItem
      key={item.to}
      item={item}
      selected={isNavActive(pathname, item.to)}
      onNavigate={close}
      staggerIndex={startIndex + i}
      menuOpen={menuOpen}
      compact={compact}
    />
  ))
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

  const { activity, encours, compte, facturation, donnees, api, other } = groupItemsBySection(group)
  const isCompact = group.layout === 'compact'

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
              transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transform: open ? 'rotate(180deg)' : 'none',
              opacity: highlighted ? 1 : 0.7,
            }}
          />
        }
        sx={topNavItemSx(theme, highlighted)}
      >
        {group.label}
      </Button>

      {open && (
        <Box
          aria-hidden
          onClick={close}
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: MEGA_MENU_Z_INDEX - 1,
            bgcolor: alpha('#0f172a', isDark ? 0.45 : 0.12),
            backdropFilter: 'blur(2px)',
            animation: `${menuReveal} 0.2s ease both`,
          }}
        />
      )}

      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        transition
        disablePortal={false}
        modifiers={[{ name: 'offset', options: { offset: [0, 10] } }]}
        sx={{ zIndex: MEGA_MENU_Z_INDEX }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={200}>
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
                    width: isCompact
                      ? {
                          md: group.id === 'parametres' ? 'min(1000px, calc(100vw - 32px))' : 'min(880px, calc(100vw - 32px))',
                          lg: group.id === 'parametres' ? 1000 : 920,
                          xl: group.id === 'parametres' ? 1020 : 940,
                        }
                      : { md: 'min(720px, calc(100vw - 32px))', lg: 800, xl: 860 },
                    maxWidth: 'calc(100vw - 24px)',
                    borderRadius: 2.5,
                    overflow: 'hidden',
                    border: `1px solid ${alpha(isDark ? '#fff' : '#0f172a', isDark ? 0.12 : 0.08)}`,
                    boxShadow: isDark
                      ? `0 24px 70px ${alpha('#000', 0.55)}`
                      : `0 24px 60px ${alpha('#0f172a', 0.14)}, 0 8px 24px ${alpha('#0f172a', 0.06)}`,
                    bgcolor: isDark ? alpha('#0f1419', 0.98) : '#ffffff',
                    animation: open ? `${menuReveal} 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) both` : 'none',
                  }}
                >
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: isDesktopPanel
                        ? 'minmax(176px, 200px) minmax(0, 1fr) minmax(200px, 220px)'
                        : '1fr',
                      gridTemplateRows: isDesktopPanel ? '1fr' : 'auto auto auto',
                      maxHeight: isDesktopPanel || isCompact ? 'none' : 'min(70vh, 520px)',
                      overflow: isDesktopPanel || isCompact ? 'visible' : 'auto',
                    }}
                  >
                    <Box
                      sx={{
                        p: isCompact ? 1.5 : 2,
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

                    <Box
                      sx={{
                        p: isCompact ? 1.25 : 1.75,
                        display: group.id === 'parametres' ? 'block' : 'grid',
                        gridTemplateColumns: isCompact
                          ? 'repeat(4, minmax(0, 1fr))'
                          : 'repeat(2, minmax(0, 1fr))',
                        gap: isCompact ? 0.5 : 0.75,
                        alignContent: 'start',
                        borderBottom: isDesktopPanel ? 'none' : `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      {group.id === 'commercial' ? (
                        <>
                          <MenuSectionLabel sx={{ pt: 0 }}>Activités courantes</MenuSectionLabel>
                          {renderMenuItems(activity, location.pathname, close, open, 0)}
                          <MenuSectionLabel sx={{ pt: 2 }}>Encours</MenuSectionLabel>
                          <Divider sx={{ gridColumn: '1 / -1', my: 0.25 }} />
                          {renderMenuItems(encours, location.pathname, close, open, activity.length)}
                        </>
                      ) : group.id === 'parametres' ? (
                        <SettingsMegaMenuColumns
                          compte={compte}
                          facturation={facturation}
                          donnees={donnees}
                          api={api}
                          renderItem={(item, index) => (
                            <MegaMenuItem
                              key={item.to}
                              item={item}
                              selected={isNavActive(location.pathname, item.to)}
                              onNavigate={close}
                              staggerIndex={index}
                              menuOpen={open}
                              compact
                            />
                          )}
                        />
                      ) : (
                        <>
                          {other.map((item, index) => {
                            if (group.id === 'finance' && index === 0) {
                              return (
                                <Box key={item.to} sx={{ display: 'contents' }}>
                                  <MenuSectionLabel sx={{ pt: 0 }}>Fiscalité &amp; compta</MenuSectionLabel>
                                  <MegaMenuItem
                                    item={item}
                                    selected={isNavActive(location.pathname, item.to)}
                                    onNavigate={close}
                                    staggerIndex={index}
                                    menuOpen={open}
                                  />
                                </Box>
                              )
                            }
                            return (
                              <MegaMenuItem
                                key={item.to}
                                item={item}
                                selected={isNavActive(location.pathname, item.to)}
                                onNavigate={close}
                                staggerIndex={index}
                                menuOpen={open}
                              />
                            )
                          })}
                        </>
                      )}
                    </Box>

                    <Box sx={{ gridColumn: isDesktopPanel ? undefined : '1 / -1' }}>
                      <MegaMenuFeatured
                        featured={group.featured}
                        accentKey={group.featured.accent}
                        horizontal={!isDesktopPanel}
                        pathname={location.pathname}
                        onNavigate={close}
                        menuOpen={open}
                        planLocked={isFeaturedPlanLocked(group)}
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
