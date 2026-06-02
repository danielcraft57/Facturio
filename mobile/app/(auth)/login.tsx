import { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Redirect, useRouter } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from '../../src/components/ui/Button'
import { Logo } from '../../src/components/ui/Logo'
import { useAuth } from '../../src/hooks/useAuth'
import { useResponsiveLayout } from '../../src/hooks/useResponsiveLayout'
import { useDocumentTitle } from '../../src/hooks/useDocumentTitle'
import { isDeviceVerification } from '../../src/types/auth'
import { APP_NAME, APP_TAGLINE } from '../../src/constants/appMetadata'
import { colors, radius, spacing, typography } from '../../src/theme'

export default function LoginScreen() {
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth()
  const { isTablet } = useResponsiveLayout()
  useDocumentTitle('Connexion')
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deviceMsg, setDeviceMsg] = useState<string | null>(null)

  if (isAuthenticated) return <Redirect href="/(app)" />

  const onSubmit = async () => {
    clearError()
    setDeviceMsg(null)
    setSubmitting(true)
    try {
      const result = await login(email, password)
      if (isDeviceVerification(result)) {
        setDeviceMsg(result.message)
        return
      }
      router.replace('/(app)')
    } catch {
      // error handled in context
    } finally {
      setSubmitting(false)
    }
  }

  const form = (
    <View style={styles.form}>
      <Text style={styles.formTitle}>Connexion</Text>
      <Text style={styles.formSubtitle}>Accédez à votre espace Facturio</Text>

      {error && <Text style={styles.error}>{error}</Text>}
      {deviceMsg && <Text style={styles.info}>{deviceMsg}</Text>}

      <Text style={styles.label}>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        style={styles.input}
        placeholder="vous@entreprise.fr"
        placeholderTextColor={colors.textMuted}
      />

      <Text style={styles.label}>Mot de passe</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
        placeholder="••••••••"
        placeholderTextColor={colors.textMuted}
      />

      <Button
        label="Se connecter"
        onPress={onSubmit}
        loading={submitting}
        fullWidth
        style={{ marginTop: spacing.lg }}
      />
    </View>
  )

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.teal} size="large" />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.container, isTablet && styles.containerTablet]}>
          {isTablet && (
            <View style={styles.hero}>
              <Logo />
              <Text style={styles.heroTitle}>La facturation simple, rapide et professionnelle</Text>
              <Text style={styles.heroSubtitle}>Créez, envoyez et suivez vos factures en toute simplicité.</Text>
              {[
                { icon: 'file-text' as const, text: 'Gérez toutes vos factures au même endroit' },
                { icon: 'send' as const, text: 'Envoyez et suivez en quelques clics' },
                { icon: 'bar-chart-2' as const, text: 'Gardez le contrôle sur vos paiements' },
              ].map((item) => (
                <View key={item.text} style={styles.featureRow}>
                  <Feather name={item.icon} size={18} color={colors.teal} />
                  <Text style={styles.featureText}>{item.text}</Text>
                </View>
              ))}
              <View style={styles.heroCta}>
                <Text style={styles.heroCtaText}>Essayer gratuitement →</Text>
              </View>
            </View>
          )}
          <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
            {!isTablet && (
              <View style={styles.mobileBrand}>
                <Logo />
              </View>
            )}
            {form}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1 },
  containerTablet: { flexDirection: 'row' },
  hero: {
    flex: 1,
    backgroundColor: colors.navy,
    padding: spacing.xl,
    justifyContent: 'center',
    gap: spacing.md,
  },
  heroTitle: {
    ...typography.hero,
    color: colors.textOnDark,
    marginTop: spacing.lg,
  },
  heroSubtitle: {
    ...typography.body,
    color: 'rgba(248,250,252,0.8)',
    marginBottom: spacing.md,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  featureText: { ...typography.body, color: colors.textOnDark, flex: 1 },
  heroCta: {
    marginTop: spacing.lg,
    backgroundColor: colors.navyDark,
    borderRadius: radius.md,
    padding: spacing.md,
    alignSelf: 'flex-start',
  },
  heroCtaText: { ...typography.subtitle, color: colors.teal },
  formScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  mobileBrand: {
    marginBottom: spacing.xl,
    backgroundColor: colors.navy,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'flex-start',
  },
  mobileAppName: {
    ...typography.title,
    color: colors.textOnDark,
    marginTop: spacing.md,
  },
  mobileTagline: {
    ...typography.body,
    color: 'rgba(248,250,252,0.85)',
    marginTop: spacing.xs,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formTitle: { ...typography.title, color: colors.text },
  formSubtitle: { ...typography.body, color: colors.textMuted, marginBottom: spacing.lg },
  label: { ...typography.caption, color: colors.textMuted, marginBottom: 4, marginTop: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.background,
  },
  error: { color: colors.error, marginBottom: spacing.sm, ...typography.body },
  info: { color: colors.info, marginBottom: spacing.sm, ...typography.body },
})
