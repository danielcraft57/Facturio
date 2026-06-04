import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { usePathname, useRouter } from 'expo-router'
import { Logo } from '../ui/Logo'
import { useAuth } from '../../hooks/useAuth'
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout'
import { APP_NAME, titleForPath } from '../../constants/appMetadata'
import { colors, radius, spacing, typography } from '../../theme'
import { useRealtimeEventsStore } from '../../stores/realtimeEventsStore'
import { useTheme } from '../../hooks/useTheme'

interface AppHeaderProps {
  /** Surcharge le titre déduit de la route */
  title?: string
  subtitle?: string
}

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const { colors: themeColors } = useTheme()
  const { useSidebarLayout, isTablet } = useResponsiveLayout()
  const eventsCount = useRealtimeEventsStore((s) => s.events.length)
  const screenTitle = title ?? titleForPath(pathname)
  const isHome =
    pathname === '/' ||
    pathname === '/(app)' ||
    pathname.endsWith('/index') ||
    (!pathname.includes('factures') &&
      !pathname.includes('devis') &&
      !pathname.includes('clients') &&
      !pathname.includes('activity') &&
      !pathname.includes('more'))
  const greeting =
    isHome && user?.firstName ? `Bonjour ${user.firstName} 👋` : undefined
  const resolvedSubtitle = subtitle ?? greeting ?? (isTablet ? user?.organization?.name : undefined)
  const initials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('') || user?.email?.[0]?.toUpperCase() || '?'

  return (
    <View style={[styles.wrap, { borderBottomColor: themeColors.border }]} accessibilityRole="header">
      <View style={styles.left}>
        {!useSidebarLayout && <Logo compact />}
        <View style={styles.titles}>
          {!useSidebarLayout && <Text style={[styles.appName, { color: themeColors.teal }]}>{APP_NAME}</Text>}
          <Text style={[styles.screenTitle, { color: themeColors.text }]} numberOfLines={1}>
            {screenTitle}
          </Text>
          {resolvedSubtitle ? (
            <Text style={[styles.subtitle, { color: themeColors.textMuted }]} numberOfLines={1}>
              {resolvedSubtitle}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable
          style={[styles.iconBtn, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
          accessibilityLabel="Notifications"
          onPress={() => router.push('/(app)/activity' as never)}
        >
          <Feather name="bell" size={20} color={themeColors.text} />
          {eventsCount > 0 && <View style={styles.badge} />}
        </Pressable>
        <View style={[styles.avatar, { backgroundColor: themeColors.navy }]}>
          <Text style={[styles.avatarText, { color: themeColors.textOnDark }]}>{initials}</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  titles: { flex: 1, minWidth: 0 },
  appName: {
    ...typography.caption,
    color: colors.teal,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  screenTitle: {
    ...typography.title,
    fontSize: 20,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.textOnDark,
    fontWeight: '700',
    fontSize: 14,
  },
  badge: {
    position: 'absolute',
    right: 7,
    top: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
})
