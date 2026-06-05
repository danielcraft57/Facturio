import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SearchInput } from '../../src/components/ui/SearchInput'
import { Card } from '../../src/components/ui/Card'
import { FloatingActionButton } from '../../src/components/ui/FloatingActionButton'
import { ShimmerBlock } from '../../src/components/ui/ShimmerBlock'
import { FormModal } from '../../src/components/ui/FormModal'
import { Button } from '../../src/components/ui/Button'
import { SwipeableRow } from '../../src/components/ui/SwipeableRow'
import { productsService } from '../../src/services/productsService'
import type { Product } from '../../src/types/product'
import { colors, radius, spacing, typography } from '../../src/theme'
import { useHaptics } from '../../src/hooks/useHaptics'
import { formatCurrency } from '../../src/utils/format'
import Animated, { FadeInDown } from 'react-native-reanimated'

export default function ProductsScreen() {
  const { impactLight, impactMedium, notifySuccess, notifyError } = useHaptics()
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [draftPrice, setDraftPrice] = useState('')
  const [draftDescription, setDraftDescription] = useState('')

  const load = useCallback(async (pageNum = 1, query = search) => {
    try {
      const result = await productsService.list({ page: pageNum, limit: 20, search: query || undefined })
      const items = result.items ?? result.products ?? []
      setProducts((prev) => (pageNum === 1 ? items : [...prev, ...items]))
      setTotal(result.total ?? items.length)
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

  const confirmDelete = (product: Product) => {
    Alert.alert('Supprimer le produit', `Supprimer « ${product.name} » ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await productsService.delete(product.id)
            setProducts((prev) => prev.filter((p) => p.id !== product.id))
            setTotal((t) => Math.max(0, t - 1))
            setFeedback('Produit supprimé.')
            await notifySuccess()
          } catch (e) {
            setFeedback(e instanceof Error ? e.message : 'Suppression impossible.')
            await notifyError()
          }
        },
      },
    ])
  }

  const duplicateProduct = async (product: Product) => {
    try {
      await productsService.create({
        name: `${product.name} (copie)`,
        unitPrice: product.unitPrice ?? undefined,
        description: product.description ?? undefined,
      })
      setFeedback('Produit dupliqué.')
      await impactMedium()
      await load(1)
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : 'Duplication impossible.')
      await notifyError()
    }
  }

  return (
    <View style={styles.root}>
      {feedback && <Text style={styles.feedback}>{feedback}</Text>}
      <Text style={styles.hint}>Glisser : gauche = supprimer, droite = dupliquer</Text>
      <View style={styles.toolbar}>
        <SearchInput value={search} onChangeText={setSearch} placeholder="Rechercher un produit…" />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ShimmerBlock height={90} />
          <ShimmerBlock height={90} />
          <ShimmerBlock height={90} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true)
                load(1)
              }}
              tintColor={colors.teal}
            />
          }
          onEndReached={() => {
            if (products.length < total) load(page + 1)
          }}
          ListEmptyComponent={<Text style={styles.empty}>Aucun produit</Text>}
          ListFooterComponent={<Text style={styles.footer}>{products.length} / {total} produits</Text>}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 20).duration(260)}>
              <SwipeableRow
                leftAction={{
                  label: 'Supprimer',
                  variant: 'delete',
                  onPress: () => confirmDelete(item),
                }}
                rightAction={{
                  label: 'Dupliquer',
                  variant: 'duplicate',
                  onPress: () => void duplicateProduct(item),
                }}
                onWebLongPress={() => void duplicateProduct(item)}
              >
                <Card style={styles.card}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.meta}>
                    {item.unitPrice != null ? formatCurrency(item.unitPrice, 'EUR') : 'Prix non renseigné'}
                  </Text>
                  {item.description ? <Text style={styles.meta}>{item.description}</Text> : null}
                </Card>
              </SwipeableRow>
            </Animated.View>
          )}
          contentContainerStyle={styles.list}
        />
      )}

      <FloatingActionButton
        label="Nouveau produit"
        onPress={async () => {
          await impactLight()
          setShowCreate(true)
        }}
      />

      <FormModal
        visible={showCreate}
        title="Nouveau produit"
        subtitle="Catalogue mobile"
        onClose={() => setShowCreate(false)}
      >
        <Text style={styles.label}>Nom</Text>
        <TextInput
          value={draftName}
          onChangeText={setDraftName}
          placeholder="Ex: Prestation horaire"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
        <Text style={styles.label}>Prix unitaire € (optionnel)</Text>
        <TextInput
          value={draftPrice}
          onChangeText={setDraftPrice}
          keyboardType="decimal-pad"
          placeholder="120"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
        <Text style={styles.label}>Description (optionnel)</Text>
        <TextInput
          value={draftDescription}
          onChangeText={setDraftDescription}
          placeholder="Détail court"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        <View style={styles.modalActions}>
          <Button
            label="Créer"
            loading={creating}
            onPress={async () => {
              if (!draftName.trim()) {
                setFeedback('Nom requis.')
                return
              }
              setCreating(true)
              try {
                const price = draftPrice.trim() ? Number(draftPrice.replace(',', '.')) : undefined
                await productsService.create({
                  name: draftName.trim(),
                  unitPrice: price != null && Number.isFinite(price) ? price : undefined,
                  description: draftDescription.trim() || undefined,
                })
                setShowCreate(false)
                setDraftName('')
                setDraftPrice('')
                setDraftDescription('')
                setFeedback('Produit créé.')
                await notifySuccess()
                await load(1)
              } catch (e) {
                setFeedback(e instanceof Error ? e.message : 'Impossible de créer le produit.')
                await notifyError()
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
  feedback: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm },
  hint: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm },
  toolbar: { marginBottom: spacing.md },
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
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  loadingWrap: { gap: spacing.sm, marginTop: spacing.sm },
  list: { paddingBottom: spacing.xxl },
  card: { marginBottom: spacing.sm },
  name: { ...typography.subtitle, color: colors.text },
  meta: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  footer: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md },
})
