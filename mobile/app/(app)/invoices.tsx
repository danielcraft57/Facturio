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
import { invoicesService } from '../../src/services/invoicesService'
import type { Invoice } from '../../src/types/invoice'
import { colors, radius, spacing, typography } from '../../src/theme'
import { queueOrRunAction } from '../../src/hooks/useLiveSync'
import { useLiveSyncStore } from '../../src/stores/liveSyncStore'

type TabKey = 'all' | 'unread'

export default function InvoicesScreen() {
  const router = useRouter()
  const netInfo = useNetInfo()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<TabKey>('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const invoicesVersion = useLiveSyncStore((s) => s.invoicesVersion)
  const online = !!netInfo.isConnected && (netInfo.isInternetReachable ?? true)

  const load = useCallback(async (pageNum = 1, query = search) => {
    try {
      const result = await invoicesService.list({ page: pageNum, limit: 10, search: query || undefined })
      const list = result.invoices ?? (result as unknown as { items?: Invoice[] }).items ?? []
      setInvoices((prev) => (pageNum === 1 ? list : [...prev, ...list]))
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
    if (invoicesVersion === 0) return
    load(1)
  }, [invoicesVersion, load])

  const filtered = useMemo(() => {
    if (tab === 'unread') return invoices.filter((inv) => !inv.seenAt)
    return invoices
  }, [invoices, tab])

  const unreadCount = invoices.filter((inv) => !inv.seenAt).length

  const sendInvoice = async (invoice: Invoice) => {
    try {
      const result = await queueOrRunAction(
        {
          method: 'POST',
          url: `/invoices/${invoice.id}/send`,
          body: {},
          description: `Envoi facture ${invoice.number}`,
        },
        online,
      )
      if (result.queued) {
        setFeedback(`Hors ligne : envoi de ${invoice.number} mis en file d'attente.`)
      } else {
        setFeedback(`Facture ${invoice.number} envoyée.`)
        await load(1)
      }
      if (Platform.OS === 'web') setTimeout(() => setFeedback(null), 3500)
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : "Impossible d'envoyer la facture")
    }
  }

  return (
    <View style={styles.root}>
      <View style={[styles.networkBanner, online ? styles.bannerOnline : styles.bannerOffline]}>
        <Text style={styles.networkText}>
          {online ? 'En ligne — synchro temps réel active' : 'Hors ligne — les envois seront synchronisés'}
        </Text>
      </View>

      {feedback && <Text style={styles.feedback}>{feedback}</Text>}

      <View style={styles.topActions}>
        <Pressable style={styles.newBtn}>
          <Feather name="plus" size={18} color={colors.surface} />
          <Text style={styles.newBtnText}>Nouvelle facture</Text>
        </Pressable>
      </View>

      <View style={styles.tabs}>
        <Pressable onPress={() => setTab('all')} style={[styles.tab, tab === 'all' && styles.tabActive]}>
          <Text style={[styles.tabText, tab === 'all' && styles.tabTextActive]}>Tous</Text>
        </Pressable>
        <Pressable onPress={() => setTab('unread')} style={[styles.tab, tab === 'unread' && styles.tabActive]}>
          <Text style={[styles.tabText, tab === 'unread' && styles.tabTextActive]}>Non lus</Text>
          {unreadCount > 0 && <View style={styles.badge} />}
        </Pressable>
      </View>

      <View style={styles.toolbar}>
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher une facture…"
        />
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
              onPress={() => router.push(`/(app)/invoices/${item.id}` as never)}
              onSend={() => sendInvoice(item)}
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
            if (invoices.length < total) load(page + 1)
          }}
          ListEmptyComponent={<Text style={styles.empty}>Aucune facture</Text>}
          ListFooterComponent={
            <Text style={styles.footer}>
              Affichage de {filtered.length} sur {total} factures
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
