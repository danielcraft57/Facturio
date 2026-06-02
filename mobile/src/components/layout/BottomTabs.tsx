import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { usePathname, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, typography } from '../../theme'

const TABS = [
  { href: '/(app)', label: 'Accueil', icon: 'home' as const },
  { href: '/(app)/invoices', label: 'Factures', icon: 'file-text' as const },
  { href: '/(app)/quotes', label: 'Devis', icon: 'clipboard' as const },
  { href: '/(app)/more', label: 'Plus', icon: 'menu' as const },
]

export function BottomTabs() {
  const pathname = usePathname()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map((tab) => {
        const active = pathname === tab.href || (tab.href !== '/(app)' && pathname.startsWith(tab.href))
        return (
          <Pressable key={tab.href} style={styles.tab} onPress={() => router.push(tab.href as never)}>
            <Feather name={tab.icon} size={22} color={active ? colors.teal : colors.textMuted} />
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
  },
  labelActive: {
    color: colors.teal,
    fontWeight: '600',
  },
})
