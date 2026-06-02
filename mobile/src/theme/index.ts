export const colors = {
  navy: '#002D3D',
  navyDark: '#001A24',
  teal: '#00C2A8',
  tealDark: '#00A892',
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  background: '#F1F5F9',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textMuted: '#64748B',
  textOnDark: '#F8FAFC',
  success: '#10B981',
  successBg: '#D1FAE5',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  error: '#EF4444',
  errorBg: '#FEE2E2',
  info: '#3B82F6',
  infoBg: '#DBEAFE',
  pendingBg: '#BFDBFE',
  sidebarActive: 'rgba(0, 194, 168, 0.18)',
  sidebarActiveBorder: '#00C2A8',
} as const

export const invoiceStatusColors = {
  paid: { bg: '#D1FAE5', text: '#047857', label: 'Payée' },
  sent: { bg: '#DBEAFE', text: '#1D4ED8', label: 'Envoyée' },
  overdue: { bg: '#FEE2E2', text: '#B91C1C', label: 'En retard' },
  draft: { bg: '#F3F4F6', text: '#4B5563', label: 'Brouillon' },
  cancelled: { bg: '#F3F4F6', text: '#6B7280', label: 'Annulée' },
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const

export const layout = {
  tabletBreakpoint: 768,
  sidebarWidth: 240,
  maxContentWidth: 1200,
} as const

export const typography = {
  hero: { fontSize: 28, fontWeight: '700' as const },
  title: { fontSize: 22, fontWeight: '700' as const },
  subtitle: { fontSize: 16, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
  kpi: { fontSize: 24, fontWeight: '700' as const },
} as const
