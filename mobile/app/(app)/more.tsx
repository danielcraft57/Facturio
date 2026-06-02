import { useEffect, useState } from 'react'
import { StyleSheet, Switch, Text, View } from 'react-native'
import { Card } from '../../src/components/ui/Card'
import { Button } from '../../src/components/ui/Button'
import { useAuth } from '../../src/hooks/useAuth'
import { flushOfflineQueue, getOfflineQueueSize } from '../../src/services/offlineQueueService'
import { getApiBaseUrl } from '../../src/utils/api'
import { colors, spacing, typography } from '../../src/theme'
import { useRouter } from 'expo-router'
import { useTheme } from '../../src/hooks/useTheme'

export default function MoreScreen() {
  const { user, logout } = useAuth()
  const { mode, isDark, toggleMode, colors: themeColors } = useTheme()
  const router = useRouter()
  const [queueSize, setQueueSize] = useState(0)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    getOfflineQueueSize().then(setQueueSize)
  }, [])

  const onLogout = async () => {
    await logout()
    router.replace('/login')
  }

  const onFlushQueue = async () => {
    setSyncing(true)
    try {
      const result = await flushOfflineQueue()
      setQueueSize(result.failed)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <View>
      <Card style={styles.card}>
        <Text style={styles.label}>Compte</Text>
        <Text style={[styles.value, { color: themeColors.text }]}>{user?.email}</Text>
        <Text style={[styles.label, { marginTop: spacing.md }]}>API</Text>
        <Text style={[styles.value, { color: themeColors.text }]}>{getApiBaseUrl()}</Text>
        <Text style={[styles.label, { marginTop: spacing.md }]}>File hors ligne</Text>
        <Text style={[styles.value, { color: themeColors.text }]}>{queueSize} action(s) en attente</Text>
        <View style={styles.themeRow}>
          <View>
            <Text style={styles.label}>Apparence</Text>
            <Text style={[styles.value, { color: themeColors.text }]}>
              {mode === 'dark' ? 'Mode sombre' : 'Mode clair'}
            </Text>
          </View>
          <Switch value={isDark} onValueChange={() => void toggleMode()} />
        </View>
      </Card>
      <Button
        label="Synchroniser maintenant"
        variant="navy"
        onPress={onFlushQueue}
        loading={syncing}
        fullWidth
      />
      <Button
        label="Voir activité temps réel"
        variant="ghost"
        onPress={() => router.push('/(app)/activity' as never)}
        fullWidth
        style={{ marginTop: spacing.md }}
      />
      <Button
        label="Catalogue produits"
        variant="ghost"
        onPress={() => router.push('/(app)/products' as never)}
        fullWidth
        style={{ marginTop: spacing.sm }}
      />
      <Button
        label="Clients"
        variant="ghost"
        onPress={() => router.push('/(app)/clients' as never)}
        fullWidth
        style={{ marginTop: spacing.sm }}
      />
      <Button label="Se déconnecter" variant="outline" onPress={onLogout} fullWidth style={{ marginTop: spacing.lg }} />
    </View>
  )
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  label: { ...typography.caption, color: colors.textMuted },
  value: { ...typography.body, color: colors.text, marginTop: 4 },
  themeRow: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
})
