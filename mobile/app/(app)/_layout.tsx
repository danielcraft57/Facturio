import { Slot, Redirect } from 'expo-router'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { AppShell } from '../../src/components/layout/AppShell'
import { useAuth } from '../../src/hooks/useAuth'
import { colors } from '../../src/theme'

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.teal} />
      </View>
    )
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />
  }

  return (
    <AppShell>
      <Slot />
    </AppShell>
  )
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
})
