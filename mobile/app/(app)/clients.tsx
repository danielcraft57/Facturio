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
import { clientsService } from '../../src/services/clientsService'
import type { Client } from '../../src/types/client'
import { colors, radius, spacing, typography } from '../../src/theme'
import { useHaptics } from '../../src/hooks/useHaptics'
import Animated, { FadeInDown } from 'react-native-reanimated'

export default function ClientsScreen() {
  const { impactLight, impactMedium, notifySuccess, notifyError } = useHaptics()
  const [clients, setClients] = useState<Client[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [draftEmail, setDraftEmail] = useState('')
  const [draftPhone, setDraftPhone] = useState('')

  const load = useCallback(async (pageNum = 1, query = search) => {
    try {
      const result = await clientsService.list({ page: pageNum, limit: 20, search: query || undefined })
      const items = result.items ?? result.clients ?? []
      setClients((prev) => (pageNum === 1 ? items : [...prev, ...items]))
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

  const confirmDelete = (client: Client) => {
    Alert.alert('Archiver le client', `Archiver « ${client.name} » ? Les factures et devis sont conservés.`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Archiver',
        style: 'destructive',
        onPress: async () => {
          try {
            await clientsService.delete(client.id)
            setClients((prev) => prev.filter((c) => c.id !== client.id))
            setTotal((t) => Math.max(0, t - 1))
            setFeedback('Client archivé.')
            await notifySuccess()
          } catch (e) {
            setFeedback(e instanceof Error ? e.message : 'Suppression impossible.')
            await notifyError()
          }
        },
      },
    ])
  }

  const duplicateClient = async (client: Client) => {
    if (!client.email) {
      setFeedback('Email requis pour dupliquer un client.')
      return
    }
    try {
      await clientsService.create({
        name: `${client.name} (copie)`,
        email: client.email,
        phone: client.phone,
      })
      setFeedback('Client dupliqué.')
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
        <SearchInput value={search} onChangeText={setSearch} placeholder="Rechercher un client…" />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ShimmerBlock height={90} />
          <ShimmerBlock height={90} />
          <ShimmerBlock height={90} />
        </View>
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(item) => item.id}
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
            if (clients.length < total) load(page + 1)
          }}
          ListEmptyComponent={<Text style={styles.empty}>Aucun client</Text>}
          ListFooterComponent={<Text style={styles.footer}>{clients.length} / {total} clients</Text>}
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
                  onPress: () => void duplicateClient(item),
                }}
                onWebLongPress={() => void duplicateClient(item)}
              >
                <Card style={styles.card}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.meta}>{item.email || 'Email non renseigné'}</Text>
                  <Text style={styles.meta}>{item.phone || item.city || 'Coordonnées à compléter'}</Text>
                </Card>
              </SwipeableRow>
            </Animated.View>
          )}
          contentContainerStyle={styles.list}
        />
      )}

      <FloatingActionButton
        label="Nouveau client"
        onPress={async () => {
          await impactLight()
          setShowCreate(true)
        }}
      />

      <FormModal
        visible={showCreate}
        title="Nouveau client"
        subtitle="Création rapide mobile"
        onClose={() => setShowCreate(false)}
      >
        <Text style={styles.label}>Nom</Text>
        <TextInput
          value={draftName}
          onChangeText={setDraftName}
          placeholder="Ex: Martin Dupont"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
        <Text style={styles.label}>Email</Text>
        <TextInput
          value={draftEmail}
          onChangeText={setDraftEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="client@exemple.fr"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
        <Text style={styles.label}>Téléphone (optionnel)</Text>
        <TextInput
          value={draftPhone}
          onChangeText={setDraftPhone}
          keyboardType="phone-pad"
          placeholder="06..."
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        <View style={styles.modalActions}>
          <Button
            label="Créer"
            loading={creating}
            onPress={async () => {
              if (!draftName.trim() || !draftEmail.trim()) {
                setFeedback('Nom et email requis.')
                return
              }
              setCreating(true)
              try {
                await clientsService.create({
                  name: draftName.trim(),
                  email: draftEmail.trim(),
                  phone: draftPhone.trim() || undefined,
                })
                setShowCreate(false)
                setDraftName('')
                setDraftEmail('')
                setDraftPhone('')
                setFeedback('Client créé avec succès.')
                await load(1)
              } catch (e) {
                setFeedback(e instanceof Error ? e.message : 'Impossible de créer le client.')
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
