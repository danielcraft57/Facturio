import { Slot, Redirect } from 'expo-router'
import { ActivityIndicator, Platform, View, StyleSheet } from 'react-native'
import Animated, { FadeInRight } from 'react-native-reanimated'
import { AppShell } from '../../src/components/layout/AppShell'
import { useAuth } from '../../src/hooks/useAuth'
import { useLiveSync } from '../../src/hooks/useLiveSync'
import { colors } from '../../src/theme'
import { useTheme } from '../../src/hooks/useTheme'

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth()
  const { colors: themeColors } = useTheme()
  useLiveSync(isAuthenticated)

  if (isLoading) {
    return (
      <View style={[styles.loader, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={colors.teal} />
      </View>
    )
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />
  }

  const content =
    Platform.OS === 'web' ? (
      <View style={styles.slot}>
        <Slot />
      </View>
    ) : (
      <Animated.View entering={FadeInRight.duration(220)} style={styles.slot}>
        <Slot />
      </Animated.View>
    )

  return <AppShell>{content}</AppShell>
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slot: { flex: 1 },
})
