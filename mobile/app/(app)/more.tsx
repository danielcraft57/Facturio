import { StyleSheet, Text, View } from 'react-native'
import { ScreenHeader } from '../../src/components/ui/ScreenHeader'
import { Card } from '../../src/components/ui/Card'
import { Button } from '../../src/components/ui/Button'
import { useAuth } from '../../src/hooks/useAuth'
import { getApiBaseUrl } from '../../src/utils/api'
import { colors, spacing, typography } from '../../src/theme'
import { useRouter } from 'expo-router'

export default function MoreScreen() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const onLogout = async () => {
    await logout()
    router.replace('/login')
  }

  return (
    <View>
      <ScreenHeader title="Paramètres" subtitle={user?.organization?.name} />
      <Card style={styles.card}>
        <Text style={styles.label}>Compte</Text>
        <Text style={styles.value}>{user?.email}</Text>
        <Text style={[styles.label, { marginTop: spacing.md }]}>API</Text>
        <Text style={styles.value}>{getApiBaseUrl()}</Text>
      </Card>
      <Button label="Se déconnecter" variant="outline" onPress={onLogout} fullWidth style={{ marginTop: spacing.lg }} />
    </View>
  )
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  label: { ...typography.caption, color: colors.textMuted },
  value: { ...typography.body, color: colors.text, marginTop: 4 },
})
