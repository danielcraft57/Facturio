import { Stack, Redirect } from 'expo-router'
import { useAuth } from '../../src/hooks/useAuth'

export default function AuthGroupLayout() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return null
  if (isAuthenticated) return <Redirect href="/(app)" />

  return <Stack screenOptions={{ headerShown: false }} />
}
