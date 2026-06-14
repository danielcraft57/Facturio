import { useCallback, useEffect, useState } from 'react'
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { MetricCard } from '../../src/components/ui/MetricCard'
import { PayableDebtListItem } from '../../src/components/finance/PayableDebtListItem'
import { SearchInput } from '../../src/components/ui/SearchInput'
import { ShimmerBlock } from '../../src/components/ui/ShimmerBlock'
import { payablesService } from '../../src/services/payablesService'
import type { PayableDebtRow } from '../../src/types/payables'
import { useLiveSyncStore } from '../../src/stores/liveSyncStore'
import { useHaptics } from '../../src/hooks/useHaptics'
import { colors, spacing, typography } from '../../src/theme'
import { formatCurrency } from '../../src/utils/format'

export default function DettesScreen() {
  const router = useRouter()
  const { notifySuccess, notifyError } = useHaptics()
  const [debts, setDebts] = useState<PayableDebtRow[]>([])
  const [total, setTotal] = useState(0)
  const [outstanding, setOutstanding] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const payablesVersion = useLiveSyncStore((s) => s.payablesVersion)

  const load = useCallback(async (pageNum = 1, query = search) => {
    try {
      const [list, summary] = await Promise.all([
        payablesService.listDebts({
          page: pageNum,
          limit: 15,
          folder: 'inbox',
          search: query || undefined,
        }),
        pageNum === 1 ? payablesService.getSummary() : Promise.resolve(null),
      ])
      setDebts((prev) => (pageNum === 1 ? list.debts : [...prev, ...list.debts]))
      setTotal(list.total)
      setPage(pageNum)
      if (summary) setOutstanding(summary.summary.totalOutstanding)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [search])

  useEffect(() => {
    void load(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (payablesVersion === 0) return
    void load(1)
  }, [payablesVersion, load])

  const archiveDebt = (debt: PayableDebtRow) => {
    Alert.alert('Archiver la dette', `Archiver « ${debt.label} » ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Archiver',
        onPress: async () => {
          try {
            await payablesService.archiveDebt(debt.id)
            setDebts((prev) => prev.filter((d) => d.id !== debt.id))
            setTotal((t) => Math.max(0, t - 1))
            setFeedback('Dette archivée.')
            await notifySuccess()
          } catch (e) {
            await notifyError()
            setFeedback(e instanceof Error ? e.message : 'Archivage impossible.')
          }
        },
      },
    ])
  }

  return (
    <View style={styles.root}>
      {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}

      {!loading && (
        <View style={styles.kpiRow}>
          <MetricCard
            label="Dettes ouvertes"
            value={formatCurrency(outstanding)}
            icon="credit-card"
            iconBg="#FEF3C7"
            iconColor={colors.warning}
          />
          <MetricCard
            label="Nombre"
            value={String(total)}
            icon="layers"
            iconBg="#E0F2FE"
            iconColor={colors.primary}
          />
        </View>
      )}

      <View style={styles.searchWrap}>
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher une dette…"
        />
      </View>
      <Text style={styles.hint}>Glisser à gauche pour archiver · tap pour le détail</Text>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ShimmerBlock height={82} />
          <ShimmerBlock height={82} />
        </View>
      ) : (
        <FlatList
          data={debts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <PayableDebtListItem
              debt={item}
              onPress={() => router.push(`/(app)/dettes/${item.id}` as never)}
              onArchive={() => archiveDebt(item)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true)
                void load(1)
              }}
              tintColor={colors.teal}
            />
          }
          onEndReached={() => {
            if (debts.length < total) void load(page + 1)
          }}
          ListEmptyComponent={<Text style={styles.empty}>Aucune dette ouverte</Text>}
          ListFooterComponent={
            <Text style={styles.footer}>
              {debts.length} sur {total} dette(s)
            </Text>
          }
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  feedback: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm },
  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  searchWrap: { marginBottom: spacing.sm },
  hint: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm },
  loadingWrap: { gap: spacing.sm },
  list: { paddingBottom: spacing.xxl },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  footer: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
})
