import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { MetricCard } from '../../src/components/ui/MetricCard'
import { ReceivableListItem } from '../../src/components/finance/ReceivableListItem'
import { ShimmerBlock } from '../../src/components/ui/ShimmerBlock'
import { receivablesService } from '../../src/services/receivablesService'
import type { ReceivableDocumentKind, ReceivablesData } from '../../src/types/receivables'
import { useLiveSyncStore } from '../../src/stores/liveSyncStore'
import { useHaptics } from '../../src/hooks/useHaptics'
import { colors, radius, spacing, typography } from '../../src/theme'
import { formatCurrency } from '../../src/utils/format'
import { AGING_BUCKET_LABELS } from '../../src/utils/financeLabels'
import type { ReceivableAgingBucket } from '../../src/types/receivables'

type KindFilter = ReceivableDocumentKind | 'all'

const KIND_TABS: Array<{ value: KindFilter; label: string }> = [
  { value: 'all', label: 'Toutes' },
  { value: 'standard', label: 'Factures' },
  { value: 'deposit', label: 'Acomptes' },
  { value: 'remainder', label: 'Soldes' },
]

const AGING_ORDER: ReceivableAgingBucket[] = [
  'not_due',
  'days_0_30',
  'days_31_60',
  'days_61_90',
  'days_90_plus',
]

export default function CreancesScreen() {
  const router = useRouter()
  const { notifySuccess, notifyError } = useHaptics()
  const [data, setData] = useState<ReceivablesData | null>(null)
  const [kind, setKind] = useState<KindFilter>('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const invoicesVersion = useLiveSyncStore((s) => s.invoicesVersion)

  const load = useCallback(async () => {
    try {
      const result = await receivablesService.getReceivables(
        kind === 'all' ? undefined : { kind },
      )
      setData(result)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [kind])

  useEffect(() => {
    setLoading(true)
    void load()
  }, [load])

  useEffect(() => {
    if (invoicesVersion === 0) return
    void load()
  }, [invoicesVersion, load])

  const invoices = data?.invoices ?? []

  const remindOne = (invoiceId: string, number: string) => {
    Alert.alert('Relancer le client', `Envoyer une relance pour ${number} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Relancer',
        onPress: async () => {
          try {
            const result = await receivablesService.remindOverdue([invoiceId])
            setFeedback(`${result.sent} relance(s) envoyée(s).`)
            await notifySuccess()
            void load()
          } catch (e) {
            await notifyError()
            setFeedback(e instanceof Error ? e.message : 'Relance impossible.')
          }
        },
      },
    ])
  }

  const remindAllOverdue = () => {
    const overdueIds = invoices.filter((i) => i.daysPastDue > 0).map((i) => i.id)
    if (!overdueIds.length) {
      setFeedback('Aucune facture en retard.')
      return
    }
    Alert.alert('Relances groupées', `Relancer ${overdueIds.length} facture(s) en retard ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Envoyer',
        onPress: async () => {
          try {
            const result = await receivablesService.remindOverdue(overdueIds)
            setFeedback(`${result.sent} relance(s) · ${result.skipped} ignorée(s).`)
            await notifySuccess()
            void load()
          } catch (e) {
            await notifyError()
            setFeedback(e instanceof Error ? e.message : 'Relances impossible.')
          }
        },
      },
    ])
  }

  const summaryHeader = useMemo(() => {
    if (!data) return null
    const { summary } = data
    return (
      <View style={styles.headerBlock}>
        <View style={styles.kpiRow}>
          <MetricCard
            label="Encours total"
            value={formatCurrency(summary.totalOutstanding)}
            icon="trending-up"
            iconBg="#FEE2E2"
            iconColor={colors.error}
          />
          <MetricCard
            label="Clients"
            value={String(summary.clientCount)}
            icon="users"
            iconBg="#DBEAFE"
            iconColor={colors.info}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.agingScroll}>
          {AGING_ORDER.map((bucket) => (
            <View key={bucket} style={styles.agingChip}>
              <Text style={styles.agingChipLabel}>{AGING_BUCKET_LABELS[bucket]}</Text>
              <Text style={styles.agingChipValue}>{formatCurrency(summary.aging[bucket] ?? 0)}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.tabs}>
          {KIND_TABS.map((tab) => (
            <Pressable
              key={tab.value}
              onPress={() => setKind(tab.value)}
              style={[styles.tab, kind === tab.value && styles.tabActive]}
            >
              <Text style={[styles.tabText, kind === tab.value && styles.tabTextActive]}>{tab.label}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.remindAllBtn} onPress={remindAllOverdue}>
          <Text style={styles.remindAllText}>Relancer toutes les factures en retard</Text>
        </Pressable>

        {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
        <Text style={styles.listHint}>
          Glisser à droite sur une facture en retard pour relancer · tap pour ouvrir
        </Text>
      </View>
    )
  }, [data, kind, feedback])

  if (loading && !data) {
    return (
      <View style={styles.loadingWrap}>
        <ShimmerBlock height={72} />
        <ShimmerBlock height={72} />
        <ShimmerBlock height={82} />
      </View>
    )
  }

  return (
    <FlatList
      data={invoices}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={summaryHeader}
      renderItem={({ item }) => (
        <ReceivableListItem
          row={item}
          onPress={() => router.push(`/(app)/factures/${item.id}` as never)}
          onRemind={() => remindOne(item.id, item.number)}
        />
      )}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true)
            void load()
          }}
          tintColor={colors.teal}
        />
      }
      ListEmptyComponent={<Text style={styles.empty}>Aucune créance ouverte</Text>}
      ListFooterComponent={
        <Text style={styles.footer}>
          {invoices.length} facture(s) · {formatCurrency(data?.summary.totalOutstanding ?? 0)} d'encours
        </Text>
      }
      contentContainerStyle={styles.list}
    />
  )
}

const styles = StyleSheet.create({
  loadingWrap: { gap: spacing.sm, paddingTop: spacing.sm },
  headerBlock: { marginBottom: spacing.md },
  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  agingScroll: { marginBottom: spacing.md },
  agingChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  agingChipLabel: { ...typography.caption, color: colors.textMuted },
  agingChipValue: { ...typography.subtitle, color: colors.text, marginTop: 2 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  tabActive: { backgroundColor: colors.infoBg },
  tabText: { ...typography.body, color: colors.textMuted },
  tabTextActive: { color: colors.primary, fontWeight: '600' },
  remindAllBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.navy,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  remindAllText: { ...typography.caption, color: colors.textOnDark, fontWeight: '700' },
  feedback: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm },
  listHint: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm },
  list: { paddingBottom: spacing.xxl },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  footer: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
})
