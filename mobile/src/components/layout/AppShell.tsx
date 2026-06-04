import { StyleSheet, View, type ViewProps } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { Sidebar } from './Sidebar'
import { BottomTabs } from './BottomTabs'
import { AppHeader } from './AppHeader'
import { colors, spacing } from '../../theme'
import { useTheme } from '../../hooks/useTheme'

interface AppShellProps extends ViewProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { useSidebarLayout } = useResponsiveLayout()
  const { colors: themeColors } = useTheme()
  useDocumentTitle()

  if (useSidebarLayout) {
    return (
      <View style={[styles.tabletRoot, { backgroundColor: themeColors.background }]}>
        <Sidebar />
        <SafeAreaView style={[styles.tabletContent, { backgroundColor: themeColors.background }]} edges={['top', 'right', 'bottom']}>
          <View style={styles.inner}>
            <AppHeader />
            {children}
          </View>
        </SafeAreaView>
      </View>
    )
  }

  return (
    <SafeAreaView style={[styles.phoneRoot, { backgroundColor: themeColors.background }]} edges={['top']}>
      <View style={styles.phoneContent}>
        <AppHeader />
        {children}
      </View>
      <BottomTabs />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  tabletRoot: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
  },
  tabletContent: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
    padding: spacing.lg,
  },
  phoneRoot: {
    flex: 1,
    backgroundColor: colors.background,
  },
  phoneContent: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
})
