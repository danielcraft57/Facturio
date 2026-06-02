import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { useOnlineStatus } from '../../../src/hooks/useOnlineStatus'
import { Card } from '../../../src/components/ui/Card'
import { StatusBadge } from '../../../src/components/ui/StatusBadge'
import { Button } from '../../../src/components/ui/Button'
import { ComboStreak } from '../../../src/components/ui/ComboStreak'
import { invoicesService } from '../../../src/services/invoicesService'
import { queueOrRunAction } from '../../../src/hooks/useLiveSync'
import { useHaptics } from '../../../src/hooks/useHaptics'
import type { Invoice } from '../../../src/types/invoice'
import { colors, spacing, typography } from '../../../src/theme'
import { formatCurrency, formatShortDate } from '../../../src/utils/format'

export default function InvoiceDetailScreen() {
  const { impactLight, notifySuccess, notifyError } = useHaptics()
  const { id } = useLocalSearchParams<{ id: string }>()
  const online = useOnlineStatus()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [combo, setCombo] = useState(0)

  useEffect(() => {
    if (!id) return
    invoicesService.getById(id).then(setInvoice).finally(() => setLoading(false))
  }, [id])

  const sendNow = async () => {
    if (!invoice) return
    try {
      const result = await queueOrRunAction(
        { method: 'POST', url: `/invoices/${invoice.id}/send`, body: {} },
        online,
      )
      if (result.queued) {
        await impactLight()
        setFeedback('Hors ligne : envoi mis en attente.')
        setCombo((v) => v + 1)
      } else {
        await notifySuccess()
        setFeedback('Facture envoyée.')
        setCombo((v) => v + 2)
      }
    } catch {
      await notifyError()
      setFeedback('Impossible d’envoyer la facture.')
      setCombo(0)
    }
  }

  if (loading) return <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.teal} />
  if (!invoice) return <Text style={styles.empty}>Facture introuvable.</Text>

  return (
    <View style={styles.root}>
      <Card>
        <Text style={styles.number}>{invoice.number}</Text>
        <StatusBadge status={invoice.status} />
        <Text style={styles.line}>Client : {invoice.client?.name ?? '—'}</Text>
        <Text style={styles.line}>Date : {formatShortDate(invoice.issueDate)}</Text>
        <Text style={styles.total}>{formatCurrency(invoice.total, invoice.currency)}</Text>
      </Card>

      {feedback && <Text style={styles.feedback}>{feedback}</Text>}
      <ComboStreak value={combo} />

      <Button label="Envoyer la facture" onPress={sendNow} variant="teal" fullWidth />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: spacing.md },
  number: { ...typography.title, color: colors.text, marginBottom: spacing.sm },
  line: { ...typography.body, color: colors.text, marginTop: 6 },
  total: { ...typography.kpi, color: colors.text, marginTop: spacing.md },
  feedback: { ...typography.caption, color: colors.textMuted },
  empty: { ...typography.body, color: colors.textMuted, marginTop: spacing.xl },
})
