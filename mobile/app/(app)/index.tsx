import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { MetricCard } from '../../src/components/ui/MetricCard'
import { DonutChart, SimpleLineChart } from '../../src/components/dashboard/ChartPlaceholders'
import { Card } from '../../src/components/ui/Card'
import { FloatingActionButton } from '../../src/components/ui/FloatingActionButton'
import { ShimmerBlock } from '../../src/components/ui/ShimmerBlock'
import { useResponsiveLayout } from '../../src/hooks/useResponsiveLayout'
import { useHaptics } from '../../src/hooks/useHaptics'
import { dashboardService } from '../../src/services/dashboardService'
import type { DashboardStats } from '../../src/types/dashboard'
import { colors, spacing, typography } from '../../src/theme'
import { formatCurrency } from '../../src/utils/format'

export default function DashboardScreen() {
  const router = useRouter()
  const { impactLight } = useHaptics()
  const { useSidebarLayout } = useResponsiveLayout()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setError(null)
      const data = await dashboardService.getStats()
      setStats(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de charger le tableau de bord')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ShimmerBlock height={72} />
        <ShimmerBlock height={72} />
        <ShimmerBlock height={220} />
        <ShimmerBlock height={180} />
      </View>
    )
  }

  const revenue = stats?.revenue
  const invoices = stats?.invoices
  const clients = stats?.clients
  const chartLabels = stats?.monthlyRevenue?.map((m) => m.month) ?? []
  const chartValues = stats?.monthlyRevenue?.map((m) => m.revenue) ?? []

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor={colors.teal} />}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {error && <Text style={styles.error}>{error}</Text>}

      <Animated.View entering={FadeInDown.delay(20).duration(260)} style={[styles.kpiGrid, useSidebarLayout && styles.kpiGridTablet]}>
        <MetricCard
          label="Chiffre d'affaires"
          value={formatCurrency(revenue?.thisMonth ?? 0)}
          trend={revenue?.growth}
          icon="trending-up"
          iconBg="#D1FAE5"
          iconColor={colors.success}
        />
        <MetricCard
          label="Factures impayées"
          value={String(invoices?.overdue ?? 0)}
          icon="alert-circle"
          iconBg="#FEE2E2"
          iconColor={colors.error}
        />
        <MetricCard
          label="Clients actifs"
          value={String(clients?.active ?? 0)}
          trend={clients?.newThisMonth}
          icon="users"
          iconBg="#DBEAFE"
          iconColor={colors.info}
        />
        <MetricCard
          label="Factures ce mois"
          value={String(invoices?.thisMonth ?? 0)}
          icon="file-text"
          iconBg="#E0F2FE"
          iconColor={colors.primary}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(60).duration(280)} style={[styles.chartsRow, useSidebarLayout && styles.chartsRowTablet]}>
        <SimpleLineChart
          title="Évolution du chiffre d'affaires"
          labels={chartLabels}
          values={chartValues.length ? chartValues : [0, 0, 0, 0]}
        />
        <DonutChart
          title="Répartition des factures"
          segments={[
            { label: 'Payées', value: invoices?.paid ?? 0, color: colors.teal },
            { label: 'En attente', value: invoices?.sent ?? 0, color: colors.info },
            { label: 'En retard', value: invoices?.overdue ?? 0, color: colors.error },
          ]}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(300)}>
        <Card style={styles.activityCard}>
        <Text style={styles.sectionTitle}>Activité récente</Text>
        {(stats?.recentActivity ?? []).slice(0, 5).map((item, i) => (
          <View key={`${item.date}-${i}`} style={styles.activityRow}>
            <Text style={styles.activityMsg}>{item.message}</Text>
            <Text style={styles.activityDate}>{new Date(item.date).toLocaleDateString('fr-FR')}</Text>
          </View>
        ))}
        {!stats?.recentActivity?.length && (
          <Text style={styles.empty}>Aucune activité récente</Text>
        )}
        </Card>
      </Animated.View>

      <FloatingActionButton
        label="Créer facture"
        onPress={async () => {
          await impactLight()
          router.push('/(app)/factures' as never)
        }}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingWrap: { gap: spacing.sm, paddingTop: spacing.sm },
  error: { color: colors.error, marginBottom: spacing.md, ...typography.body },
  kpiGrid: { gap: spacing.sm, marginBottom: spacing.lg },
  kpiGridTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chartsRow: { gap: spacing.sm, marginBottom: spacing.lg },
  chartsRowTablet: { flexDirection: 'row' },
  activityCard: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.subtitle, color: colors.text, marginBottom: spacing.md },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  activityMsg: { ...typography.body, color: colors.text, flex: 1, marginRight: spacing.sm },
  activityDate: { ...typography.caption, color: colors.textMuted },
  empty: { ...typography.body, color: colors.textMuted },
})
