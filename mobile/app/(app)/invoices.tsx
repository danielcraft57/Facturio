import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useOnlineStatus } from '../../src/hooks/useOnlineStatus'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { SwipeableRow } from '../../src/components/ui/SwipeableRow'
import { SearchInput } from '../../src/components/ui/SearchInput'
import { InvoiceListItem } from '../../src/components/invoices/InvoiceListItem'
import { FloatingActionButton } from '../../src/components/ui/FloatingActionButton'
import { ShimmerBlock } from '../../src/components/ui/ShimmerBlock'
import { FormModal } from '../../src/components/ui/FormModal'
import { Button } from '../../src/components/ui/Button'
import { AutocompleteInput, type AutocompleteOption } from '../../src/components/ui/AutocompleteInput'
import { invoicesService } from '../../src/services/invoicesService'
import { clientsService } from '../../src/services/clientsService'
import { productsService } from '../../src/services/productsService'
import type { Client } from '../../src/types/client'
import type { Invoice } from '../../src/types/invoice'
import { colors, radius, spacing, typography } from '../../src/theme'
import { queueOrRunAction } from '../../src/hooks/useLiveSync'
import { useLiveSyncStore } from '../../src/stores/liveSyncStore'
import { useHaptics } from '../../src/hooks/useHaptics'

type TabKey = 'all' | 'unread'
type DraftLine = { id: string; description: string; quantity: string; unitPrice: string }

export default function InvoicesScreen() {
  const router = useRouter()
  const { impactLight, impactMedium, notifySuccess, notifyError } = useHaptics()
  const online = useOnlineStatus()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<TabKey>('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [clientSuggestions, setClientSuggestions] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(undefined)
  const [productSuggestionsByLine, setProductSuggestionsByLine] = useState<
    Record<string, Array<{ id: number; name: string; unitPrice?: number | null }>>
  >({})
  const [draftLines, setDraftLines] = useState<DraftLine[]>([
    { id: 'line-1', description: 'Prestation', quantity: '1', unitPrice: '120' },
  ])
  const [draftClientName, setDraftClientName] = useState('')
  const [draftDueDate, setDraftDueDate] = useState('')
  const totalPulse = useSharedValue(1)
  const previousDraftTotal = useRef(0)
  const invoicesVersion = useLiveSyncStore((s) => s.invoicesVersion)

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
    const q = draftClientName.trim()
    if (q.length < 2) {
      setClientSuggestions([])
      return
    }
    clientsService.list({ page: 1, limit: 8, search: q }).then((res) => {
      setClientSuggestions(res.items ?? res.clients ?? [])
    }).catch(() => setClientSuggestions([]))
  }, [draftClientName])

  const productCacheRef = useRef<Record<string, Array<{ id: number; name: string; unitPrice?: number | null }>>>({})
  const productDebounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const queryProducts = useCallback((lineId: string, rawQuery: string) => {
    const query = rawQuery.trim().toLowerCase()
    if (productDebounceRef.current[lineId]) clearTimeout(productDebounceRef.current[lineId])
    if (query.length < 2) {
      setProductSuggestionsByLine((prev) => ({ ...prev, [lineId]: [] }))
      return
    }
    if (productCacheRef.current[query]) {
      setProductSuggestionsByLine((prev) => ({ ...prev, [lineId]: productCacheRef.current[query] }))
      return
    }
    productDebounceRef.current[lineId] = setTimeout(() => {
      productsService.search(query, 6)
        .then((items) => {
          productCacheRef.current[query] = items
          setProductSuggestionsByLine((prev) => ({ ...prev, [lineId]: items }))
        })
        .catch(() => setProductSuggestionsByLine((prev) => ({ ...prev, [lineId]: [] })))
    }, 220)
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

  const updateLine = (lineId: string, patch: Partial<DraftLine>) => {
    setDraftLines((prev) => prev.map((line) => (line.id === lineId ? { ...line, ...patch } : line)))
  }

  const addLine = () => {
    const nextId = `line-${Date.now()}`
    setDraftLines((prev) => [...prev, { id: nextId, description: '', quantity: '1', unitPrice: '0' }])
    setProductSuggestionsByLine((prev) => ({ ...prev, [nextId]: [] }))
  }

  const removeLine = (lineId: string) => {
    setDraftLines((prev) => (prev.length <= 1 ? prev : prev.filter((line) => line.id !== lineId)))
    setProductSuggestionsByLine((prev) => {
      const next = { ...prev }
      delete next[lineId]
      return next
    })
  }

  const duplicateLine = async (lineId: string) => {
    const source = draftLines.find((line) => line.id === lineId)
    if (!source) return
    const clone = { ...source, id: `line-${Date.now()}` }
    setDraftLines((prev) => [...prev, clone])
    await impactMedium()
  }

  const isWeb = Platform.OS === 'web'

  const draftTotal = draftLines.reduce((sum, line) => {
    const q = Number(line.quantity || '0')
    const p = Number(line.unitPrice || '0')
    if (!Number.isFinite(q) || !Number.isFinite(p)) return sum
    return sum + q * p
  }, 0)

  useEffect(() => {
    if (!showCreate) return
    if (previousDraftTotal.current !== 0 && previousDraftTotal.current !== draftTotal) {
      void impactLight()
      totalPulse.value = withSpring(1.08, { damping: 9, stiffness: 180 }, () => {
        totalPulse.value = withSpring(1)
      })
    }
    previousDraftTotal.current = draftTotal
  }, [draftTotal, impactLight, showCreate, totalPulse])

  const totalAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: totalPulse.value }],
  }))

  const archiveInvoice = (invoice: Invoice) => {
    Alert.alert('Archiver la facture', `Archiver ${invoice.number} ? (pas de suppression définitive)`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Archiver',
        onPress: async () => {
          try {
            await invoicesService.archive(invoice.id)
            setInvoices((prev) => prev.filter((inv) => inv.id !== invoice.id))
            setTotal((t) => Math.max(0, t - 1))
            setFeedback(`Facture ${invoice.number} archivée.`)
            await notifySuccess()
          } catch (e) {
            await notifyError()
            setFeedback(e instanceof Error ? e.message : "Impossible d'archiver la facture.")
          }
        },
      },
    ])
  }

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
        await impactLight()
      } else {
        setFeedback(`Facture ${invoice.number} envoyée.`)
        await notifySuccess()
        await load(1)
      }
      if (Platform.OS === 'web') setTimeout(() => setFeedback(null), 3500)
    } catch (e) {
      await notifyError()
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

      <View style={styles.tabs}>
        <Pressable onPress={() => setTab('all')} style={[styles.tab, tab === 'all' && styles.tabActive]}>
          <Text style={[styles.tabText, tab === 'all' && styles.tabTextActive]}>Tous</Text>
        </Pressable>
        <Pressable onPress={() => setTab('unread')} style={[styles.tab, tab === 'unread' && styles.tabActive]}>
          <Text style={[styles.tabText, tab === 'unread' && styles.tabTextActive]}>Non lus</Text>
          {unreadCount > 0 && <View style={styles.badge} />}
        </Pressable>
      </View>

      <Text style={styles.listHint}>Glisser sur une facture : gauche = archiver, droite = envoyer</Text>
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
        <View style={styles.loadingWrap}>
          <ShimmerBlock height={82} />
          <ShimmerBlock height={82} />
          <ShimmerBlock height={82} />
        </View>
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
              onArchive={() => archiveInvoice(item)}
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

      <FloatingActionButton
        label="Nouvelle facture"
        onPress={async () => {
          await impactLight()
          setShowCreate(true)
        }}
      />

      <FormModal
        visible={showCreate}
        title="Nouvelle facture"
        subtitle="Création rapide mobile"
        onClose={() => setShowCreate(false)}
      >
        <Text style={styles.label}>Client</Text>
        <AutocompleteInput
          value={draftClientName}
          onChangeText={(v) => {
            setSelectedClientId(undefined)
            setDraftClientName(v)
          }}
          placeholder="Nom du client"
          options={clientSuggestions.map<AutocompleteOption>((c) => ({
            id: c.id,
            label: c.name,
            hint: c.email || undefined,
          }))}
          onSelect={(option) => {
            setSelectedClientId(option.id)
            setDraftClientName(option.label)
            setClientSuggestions([])
          }}
        />
        <Text style={styles.label}>Lignes</Text>
        {draftLines.map((line, index) => (
          <View key={line.id}>
            {isWeb ? (
              <Pressable
                style={styles.lineCard}
                onLongPress={() => void duplicateLine(line.id)}
              >
                <View style={styles.lineHead}>
                  <Text style={styles.lineTitle}>Ligne {index + 1}</Text>
                  <Pressable onPress={() => removeLine(line.id)}>
                    <Text style={styles.removeLine}>Supprimer</Text>
                  </Pressable>
                </View>
                <AutocompleteInput
                  value={line.description}
                  onChangeText={(value) => {
                    updateLine(line.id, { description: value })
                    queryProducts(line.id, value)
                  }}
                  placeholder="Produit ou prestation"
                  options={(productSuggestionsByLine[line.id] ?? []).map<AutocompleteOption>((p) => ({
                    id: String(p.id),
                    label: p.name,
                    hint: typeof p.unitPrice === 'number' ? `${p.unitPrice.toFixed(2)} €` : undefined,
                  }))}
                  onSelect={(option) => {
                    const selected = (productSuggestionsByLine[line.id] ?? []).find((p) => String(p.id) === option.id)
                    updateLine(line.id, {
                      description: option.label,
                      unitPrice: selected?.unitPrice != null ? String(selected.unitPrice) : line.unitPrice,
                    })
                    setProductSuggestionsByLine((prev) => ({ ...prev, [line.id]: [] }))
                  }}
                />
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Qté</Text>
                    <TextInput
                      value={line.quantity}
                      onChangeText={(value) => updateLine(line.id, { quantity: value })}
                      keyboardType="number-pad"
                      style={styles.input}
                      returnKeyType={index === draftLines.length - 1 ? 'next' : 'done'}
                      onSubmitEditing={() => {
                        if (index === draftLines.length - 1) addLine()
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Prix unitaire €</Text>
                    <TextInput
                      value={line.unitPrice}
                      onChangeText={(value) => updateLine(line.id, { unitPrice: value })}
                      keyboardType="decimal-pad"
                      style={styles.input}
                    />
                  </View>
                </View>
              </Pressable>
            ) : (
              <SwipeableRow
                leftAction={{
                  label: 'Retirer',
                  variant: 'delete',
                  disabled: draftLines.length <= 1,
                  onPress: () => {
                    if (draftLines.length <= 1) return
                    void impactLight().then(() => removeLine(line.id))
                  },
                }}
                rightAction={{
                  label: 'Dupliquer',
                  variant: 'duplicate',
                  onPress: () => void duplicateLine(line.id),
                }}
                onWebLongPress={() => void duplicateLine(line.id)}
              >
                <View style={styles.lineCard}>
                  <View style={styles.lineHead}>
                    <Text style={styles.lineTitle}>Ligne {index + 1}</Text>
                    <Pressable onPress={() => removeLine(line.id)}>
                      <Text style={styles.removeLine}>Supprimer</Text>
                    </Pressable>
                  </View>
                  <AutocompleteInput
                    value={line.description}
                    onChangeText={(value) => {
                      updateLine(line.id, { description: value })
                      queryProducts(line.id, value)
                    }}
                    placeholder="Produit ou prestation"
                    options={(productSuggestionsByLine[line.id] ?? []).map<AutocompleteOption>((p) => ({
                      id: String(p.id),
                      label: p.name,
                      hint: typeof p.unitPrice === 'number' ? `${p.unitPrice.toFixed(2)} €` : undefined,
                    }))}
                    onSelect={(option) => {
                      const selected = (productSuggestionsByLine[line.id] ?? []).find((p) => String(p.id) === option.id)
                      updateLine(line.id, {
                        description: option.label,
                        unitPrice: selected?.unitPrice != null ? String(selected.unitPrice) : line.unitPrice,
                      })
                      setProductSuggestionsByLine((prev) => ({ ...prev, [line.id]: [] }))
                    }}
                  />
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Qté</Text>
                      <TextInput
                        value={line.quantity}
                        onChangeText={(value) => updateLine(line.id, { quantity: value })}
                        keyboardType="number-pad"
                        style={styles.input}
                        returnKeyType={index === draftLines.length - 1 ? 'next' : 'done'}
                        onSubmitEditing={() => {
                          if (index === draftLines.length - 1) addLine()
                        }}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Prix unitaire €</Text>
                      <TextInput
                        value={line.unitPrice}
                        onChangeText={(value) => updateLine(line.id, { unitPrice: value })}
                        keyboardType="decimal-pad"
                        style={styles.input}
                      />
                    </View>
                  </View>
                </View>
              </SwipeableRow>
            )}
          </View>
        ))}
        <Button label="+ Ajouter une ligne" variant="ghost" onPress={addLine} fullWidth />
        <Animated.Text style={[styles.totalPreview, totalAnimatedStyle]}>
          Total brouillon: {draftTotal.toFixed(2)} €
        </Animated.Text>
        <Text style={styles.hint}>Lignes du brouillon : gauche = retirer, droite = dupliquer</Text>
        <Text style={styles.label}>Échéance (YYYY-MM-DD)</Text>
        <TextInput
          value={draftDueDate}
          onChangeText={setDraftDueDate}
          placeholder="2026-12-31"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        <View style={styles.modalActions}>
          <Button
            label="Créer"
            loading={creating}
            onPress={async () => {
              const normalizedLines = draftLines
                .map((line) => ({
                  description: line.description.trim(),
                  quantity: Number(line.quantity || '0'),
                  unitPrice: Number(line.unitPrice || '0'),
                }))
                .filter((line) => line.description && line.quantity > 0 && line.unitPrice > 0)
              if (!draftClientName.trim() || normalizedLines.length === 0) {
                setFeedback('Client et au moins une ligne valide requis.')
                return
              }
              setCreating(true)
              try {
                await invoicesService.createQuickDraft({
                  clientId: selectedClientId,
                  clientName: draftClientName.trim(),
                  lines: normalizedLines,
                  dueDate: draftDueDate.trim() || new Date().toISOString().slice(0, 10),
                })
                setShowCreate(false)
                setSelectedClientId(undefined)
                setDraftLines([{ id: 'line-1', description: 'Prestation', quantity: '1', unitPrice: '120' }])
                setFeedback('Facture brouillon créée.')
                await notifySuccess()
                await load(1)
              } catch (e) {
                await notifyError()
                setFeedback(e instanceof Error ? e.message : 'Impossible de créer la facture.')
              } finally {
                setCreating(false)
              }
            }}
            fullWidth
            style={{ flex: 1 }}
          />
          <Button label="Annuler" variant="outline" onPress={() => setShowCreate(false)} fullWidth style={{ flex: 1 }} />
        </View>
      </FormModal>
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
  loadingWrap: { gap: spacing.sm, marginTop: spacing.sm },
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
  row: { flexDirection: 'row', gap: spacing.sm },
  lineCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  lineHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lineTitle: { ...typography.caption, color: colors.text, fontWeight: '700' },
  removeLine: { ...typography.caption, color: colors.error },
  totalPreview: { ...typography.subtitle, color: colors.text, marginTop: spacing.sm, textAlign: 'right' },
  listHint: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm },
  hint: { ...typography.caption, color: colors.textMuted, textAlign: 'right', marginTop: 2 },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
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
  list: { paddingBottom: spacing.xxl },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  footer: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
})
