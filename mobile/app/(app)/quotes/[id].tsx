import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { useOnlineStatus } from '../../../src/hooks/useOnlineStatus'
import { Card } from '../../../src/components/ui/Card'
import { StatusBadge } from '../../../src/components/ui/StatusBadge'
import { Button } from '../../../src/components/ui/Button'
import { ComboStreak } from '../../../src/components/ui/ComboStreak'
import { quotesService } from '../../../src/services/quotesService'
import { queueOrRunAction } from '../../../src/hooks/useLiveSync'
import { useHaptics } from '../../../src/hooks/useHaptics'
import type { Quote } from '../../../src/types/quote'
import { colors, spacing, typography } from '../../../src/theme'
import { formatCurrency, formatShortDate } from '../../../src/utils/format'

export default function QuoteDetailScreen() {
  const { impactLight, notifySuccess, notifyError } = useHaptics()
  const { id } = useLocalSearchParams<{ id: string }>()
  const online = useOnlineStatus()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [combo, setCombo] = useState(0)

  useEffect(() => {
    if (!id) return
    quotesService.getById(id).then(setQuote).finally(() => setLoading(false))
  }, [id])

  const sendNow = async () => {
    if (!quote) return
    try {
      const result = await queueOrRunAction(
        { method: 'POST', url: `/quotes/${quote.id}/send`, body: {} },
        online,
      )
      if (result.queued) {
        await impactLight()
        setFeedback('Hors ligne : envoi mis en attente.')
        setCombo((v) => v + 1)
      } else {
        await notifySuccess()
        setFeedback('Devis envoyé.')
        setCombo((v) => v + 2)
      }
    } catch {
      await notifyError()
      setFeedback('Erreur pendant l’envoi du devis.')
      setCombo(0)
    }
  }

  const acceptNow = async () => {
    if (!quote) return
    try {
      const result = await queueOrRunAction(
        { method: 'POST', url: `/quotes/${quote.id}/accept`, body: {} },
        online,
      )
      setFeedback(result.queued ? 'Acceptation mise en attente (hors ligne).' : 'Devis accepté.')
      await notifySuccess()
      setCombo((v) => v + (result.queued ? 1 : 3))
    } catch {
      await notifyError()
      setFeedback('Impossible d’accepter le devis.')
      setCombo(0)
    }
  }

  const rejectNow = async () => {
    if (!quote) return
    try {
      const result = await queueOrRunAction(
        { method: 'POST', url: `/quotes/${quote.id}/reject`, body: {} },
        online,
      )
      setFeedback(result.queued ? 'Refus mis en attente (hors ligne).' : 'Devis refusé.')
      await impactLight()
      setCombo((v) => v + 1)
    } catch {
      await notifyError()
      setFeedback('Impossible de refuser le devis.')
      setCombo(0)
    }
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
      <ComboStreak value={combo} />

      <Button label="Envoyer le devis" onPress={sendNow} variant="teal" fullWidth />
      <View style={styles.row}>
        <Button label="Accepter" onPress={acceptNow} variant="navy" fullWidth style={styles.colBtn} />
        <Button label="Refuser" onPress={rejectNow} variant="outline" fullWidth style={styles.colBtn} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: spacing.md },
  number: { ...typography.title, color: colors.text, marginBottom: spacing.sm },
  line: { ...typography.body, color: colors.text, marginTop: 6 },
  total: { ...typography.kpi, color: colors.text, marginTop: spacing.md },
  feedback: { ...typography.caption, color: colors.textMuted },
  row: { flexDirection: 'row', gap: spacing.sm },
  colBtn: { flex: 1 },
  empty: { ...typography.body, color: colors.textMuted, marginTop: spacing.xl },
})
