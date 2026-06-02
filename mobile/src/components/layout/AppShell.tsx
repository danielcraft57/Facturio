import { StyleSheet, View, type ViewProps } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { Sidebar } from './Sidebar'
import { BottomTabs } from './BottomTabs'
import { AppHeader } from './AppHeader'
import { colors, spacing } from '../../theme'

interface AppShellProps extends ViewProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { isTablet } = useResponsiveLayout()
  useDocumentTitle()

  if (isTablet) {
    return (
      <View style={styles.tabletRoot}>
        <Sidebar />
        <SafeAreaView style={styles.tabletContent} edges={['top', 'right', 'bottom']}>
          <View style={styles.inner}>
            <AppHeader />
            {children}
          </View>
        </SafeAreaView>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.phoneRoot} edges={['top']}>
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
