import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { usePathname, useRouter } from 'expo-router'
import { Logo } from '../ui/Logo'
import { colors, layout, radius, spacing, typography } from '../../theme'

const NAV_ITEMS = [
  { href: '/(app)', label: 'Tableau de bord', icon: 'grid' as const },
  { href: '/(app)/factures', label: 'Factures', icon: 'file-text' as const },
  { href: '/(app)/devis', label: 'Devis', icon: 'clipboard' as const },
  { href: '/(app)/activity', label: 'Activité', icon: 'activity' as const },
  { href: '/(app)/clients', label: 'Clients', icon: 'users' as const },
  { href: '/(app)/products', label: 'Produits', icon: 'package' as const },
  { href: '/(app)/more', label: 'Paramètres', icon: 'settings' as const },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <View style={styles.sidebar}>
      <View style={styles.brand}>
        <Logo />
      </View>
      <ScrollView contentContainerStyle={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== '/(app)' && pathname.startsWith(item.href))
          return (
            <Pressable
              key={item.href}
              onPress={() => router.push(item.href as never)}
              style={[styles.item, active && styles.itemActive]}
            >
              <Feather name={item.icon} size={18} color={active ? colors.teal : colors.textOnDark} />
              <Text style={[styles.itemLabel, active && styles.itemLabelActive]}>{item.label}</Text>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  sidebar: {
    width: layout.sidebarWidth,
    backgroundColor: colors.navy,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  brand: {
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xl,
  },
  nav: { gap: 4 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  itemActive: {
    backgroundColor: colors.sidebarActive,
    borderLeftWidth: 3,
    borderLeftColor: colors.sidebarActiveBorder,
  },
  itemLabel: {
    ...typography.body,
    color: 'rgba(248,250,252,0.75)',
  },
  itemLabelActive: {
    color: colors.textOnDark,
    fontWeight: '600',
  },
})
