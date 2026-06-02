import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { useRealtimeEventsStore } from '../../src/stores/realtimeEventsStore'
import { Card } from '../../src/components/ui/Card'
import { colors, spacing, typography } from '../../src/theme'

function label(event: { resource?: string; number?: string; action?: string; status?: string }) {
  const doc = event.resource === 'quotes' ? 'Devis' : 'Facture'
  const num = event.number ? ` ${event.number}` : ''
  const status = event.status?.toUpperCase()
  const action = event.action?.toUpperCase()
  if (status === 'EMAIL_OPENED') return `${doc}${num} vu`
  if (status === 'EMAIL_CLICKED') return `${doc}${num} cliqué`
  if (status === 'ACCEPTED') return `${doc}${num} accepté`
  if (status === 'REJECTED') return `${doc}${num} refusé`
  if (status === 'PAID' || action === 'PAID') return `${doc}${num} payé`
  return `${doc}${num} ${action?.toLowerCase() ?? 'mis à jour'}`
}

export default function ActivityScreen() {
  const events = useRealtimeEventsStore((s) => s.events)
  const clearEvents = useRealtimeEventsStore((s) => s.clearEvents)

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Activité temps réel</Text>
        <Pressable onPress={clearEvents}>
          <Text style={styles.clear}>Effacer</Text>
        </Pressable>
      </View>

      <FlatList
        data={events}
        keyExtractor={(item, idx) => `${item.at ?? 'at'}-${item.id ?? 'id'}-${idx}`}
        ListEmptyComponent={<Text style={styles.empty}>Aucun événement reçu pour le moment.</Text>}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Text style={styles.main}>{label(item)}</Text>
            <Text style={styles.meta}>
              {item.at ? new Date(item.at).toLocaleString('fr-FR') : 'juste maintenant'}
            </Text>
          </Card>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: { ...typography.title, color: colors.text, fontSize: 22 },
  clear: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  list: { paddingBottom: spacing.xxl, gap: spacing.sm },
  card: { marginBottom: spacing.sm },
  main: { ...typography.body, color: colors.text, fontWeight: '600' },
  meta: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
})
