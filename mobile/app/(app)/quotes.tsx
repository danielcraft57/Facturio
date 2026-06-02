import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useNetInfo } from '@react-native-community/netinfo'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { SearchInput } from '../../src/components/ui/SearchInput'
import { InvoiceListItem } from '../../src/components/invoices/InvoiceListItem'
import { queueOrRunAction } from '../../src/hooks/useLiveSync'
import { useLiveSyncStore } from '../../src/stores/liveSyncStore'
import { quotesService } from '../../src/services/quotesService'
import type { Quote } from '../../src/types/quote'
import { colors, radius, spacing, typography } from '../../src/theme'

type TabKey = 'all' | 'pending'

export default function QuotesScreen() {
  const router = useRouter()
  const netInfo = useNetInfo()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<TabKey>('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const quotesVersion = useLiveSyncStore((s) => s.quotesVersion)
  const online = !!netInfo.isConnected && (netInfo.isInternetReachable ?? true)

  const load = useCallback(async (pageNum = 1, query = search) => {
    try {
      const result = await quotesService.list({ page: pageNum, limit: 10, search: query || undefined })
      const list = result.quotes ?? (result as unknown as { items?: Quote[] }).items ?? []
      setQuotes((prev) => (pageNum === 1 ? list : [...prev, ...list]))
      setTotal(result.total ?? list.length)
      setPage(pageNum)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [search])

  useEffect(() => {
    load(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (quotesVersion === 0) return
    load(1)
  }, [quotesVersion, load])

  const filtered = useMemo(() => {
    if (tab === 'pending') return quotes.filter((q) => q.status === 'sent')
    return quotes
  }, [quotes, tab])

  const pendingCount = quotes.filter((q) => q.status === 'sent').length

  const sendQuote = async (quote: Quote) => {
    try {
      const result = await queueOrRunAction(
        {
          method: 'POST',
          url: `/quotes/${quote.id}/send`,
          body: {},
          description: `Envoi devis ${quote.number}`,
        },
        online,
      )
      if (result.queued) {
        setFeedback(`Hors ligne : envoi de ${quote.number} mis en file d'attente.`)
      } else {
        setFeedback(`Devis ${quote.number} envoyé.`)
        await load(1)
      }
      if (Platform.OS === 'web') setTimeout(() => setFeedback(null), 3500)
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : "Impossible d'envoyer le devis")
    }
  }

  return (
    <View style={styles.root}>
      <View style={[styles.networkBanner, online ? styles.bannerOnline : styles.bannerOffline]}>
        <Text style={styles.networkText}>
          {online ? 'En ligne — synchro temps réel active' : 'Hors ligne — envois différés'}
        </Text>
      </View>

      {feedback && <Text style={styles.feedback}>{feedback}</Text>}

      <View style={styles.topActions}>
        <Pressable style={styles.newBtn}>
          <Feather name="plus" size={18} color={colors.surface} />
          <Text style={styles.newBtnText}>Nouveau devis</Text>
        </Pressable>
      </View>

      <View style={styles.tabs}>
        <Pressable onPress={() => setTab('all')} style={[styles.tab, tab === 'all' && styles.tabActive]}>
          <Text style={[styles.tabText, tab === 'all' && styles.tabTextActive]}>Tous</Text>
        </Pressable>
        <Pressable onPress={() => setTab('pending')} style={[styles.tab, tab === 'pending' && styles.tabActive]}>
          <Text style={[styles.tabText, tab === 'pending' && styles.tabTextActive]}>En attente</Text>
          {pendingCount > 0 && <View style={styles.badge} />}
        </Pressable>
      </View>

      <View style={styles.toolbar}>
        <SearchInput value={search} onChangeText={setSearch} placeholder="Rechercher un devis…" />
        <Pressable style={styles.filterBtn} onPress={() => load(1, search)}>
          <Feather name="sliders" size={18} color={colors.text} />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.teal} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <InvoiceListItem
              invoice={item}
              unread={!item.seenAt}
              onPress={() => router.push(`/(app)/quotes/${item.id}` as never)}
              onSend={() => sendQuote(item)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(1) }}
              tintColor={colors.teal}
            />
          }
          onEndReached={() => {
            if (quotes.length < total) load(page + 1)
          }}
          ListEmptyComponent={<Text style={styles.empty}>Aucun devis</Text>}
          ListFooterComponent={
            <Text style={styles.footer}>
              Affichage de {filtered.length} sur {total} devis
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
  networkBanner: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  bannerOnline: { backgroundColor: colors.successBg },
  bannerOffline: { backgroundColor: colors.warningBg },
  networkText: { ...typography.caption, color: colors.text, fontWeight: '600' },
  feedback: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm },
  topActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.sm,
  },
  tabs: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabActive: { backgroundColor: colors.infoBg },
  tabText: { ...typography.body, color: colors.textMuted },
  tabTextActive: { color: colors.primary, fontWeight: '600' },
  badge: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  toolbar: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  newBtnText: { ...typography.caption, color: colors.surface, fontWeight: '700' },
  list: { paddingBottom: spacing.xxl },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  footer: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
})
