import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { usePathname } from 'expo-router'
import { Logo } from '../ui/Logo'
import { useAuth } from '../../hooks/useAuth'
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout'
import { APP_NAME, titleForPath } from '../../constants/appMetadata'
import { colors, radius, spacing, typography } from '../../theme'

interface AppHeaderProps {
  /** Surcharge le titre déduit de la route */
  title?: string
  subtitle?: string
}

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { isTablet } = useResponsiveLayout()
  const screenTitle = title ?? titleForPath(pathname)
  const isHome =
    pathname === '/' ||
    pathname === '/(app)' ||
    pathname.endsWith('/index') ||
    (!pathname.includes('invoices') &&
      !pathname.includes('quotes') &&
      !pathname.includes('clients') &&
      !pathname.includes('more'))
  const greeting =
    isHome && user?.firstName ? `Bonjour ${user.firstName} 👋` : undefined
  const resolvedSubtitle = subtitle ?? greeting ?? (isTablet ? user?.organization?.name : undefined)
  const initials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('') || user?.email?.[0]?.toUpperCase() || '?'

  return (
    <View style={styles.wrap} accessibilityRole="header">
      <View style={styles.left}>
        {!isTablet && <Logo compact />}
        <View style={styles.titles}>
          {!isTablet && <Text style={styles.appName}>{APP_NAME}</Text>}
          <Text style={styles.screenTitle} numberOfLines={1}>
            {screenTitle}
          </Text>
          {resolvedSubtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {resolvedSubtitle}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.iconBtn} accessibilityLabel="Notifications">
          <Feather name="bell" size={20} color={colors.text} />
        </Pressable>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
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
})
