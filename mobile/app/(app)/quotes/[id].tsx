import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { useNetInfo } from '@react-native-community/netinfo'
import { Card } from '../../../src/components/ui/Card'
import { StatusBadge } from '../../../src/components/ui/StatusBadge'
import { quotesService } from '../../../src/services/quotesService'
import { queueOrRunAction } from '../../../src/hooks/useLiveSync'
import type { Quote } from '../../../src/types/quote'
import { colors, spacing, typography } from '../../../src/theme'
import { formatCurrency, formatShortDate } from '../../../src/utils/format'

export default function QuoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const netInfo = useNetInfo()
  const online = !!netInfo.isConnected && (netInfo.isInternetReachable ?? true)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    quotesService.getById(id).then(setQuote).finally(() => setLoading(false))
  }, [id])

  const sendNow = async () => {
    if (!quote) return
    const result = await queueOrRunAction(
      { method: 'POST', url: `/quotes/${quote.id}/send`, body: {} },
      online,
    )
    setFeedback(result.queued ? 'Hors ligne : envoi mis en attente.' : 'Devis envoyé.')
  }

  if (loading) return <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.teal} />
  if (!quote) return <Text style={styles.empty}>Devis introuvable.</Text>

  return (
    <View style={styles.root}>
      <Card>
        <Text style={styles.number}>{quote.number}</Text>
        <StatusBadge status={quote.status} />
        <Text style={styles.line}>Client : {quote.client?.name ?? '—'}</Text>
        <Text style={styles.line}>Date : {formatShortDate(quote.issueDate)}</Text>
        <Text style={styles.total}>{formatCurrency(quote.total, quote.currency)}</Text>
      </Card>

      {feedback && <Text style={styles.feedback}>{feedback}</Text>}

      <Pressable style={styles.sendBtn} onPress={sendNow}>
        <Text style={styles.sendText}>Envoyer le devis</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: spacing.md },
  number: { ...typography.title, color: colors.text, marginBottom: spacing.sm },
  line: { ...typography.body, color: colors.text, marginTop: 6 },
  total: { ...typography.kpi, color: colors.text, marginTop: spacing.md },
  feedback: { ...typography.caption, color: colors.textMuted },
  sendBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  sendText: { ...typography.subtitle, color: colors.surface },
  empty: { ...typography.body, color: colors.textMuted, marginTop: spacing.xl },
})
