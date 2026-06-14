import { useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Card } from '../../../src/components/ui/Card'
import { Button } from '../../../src/components/ui/Button'
import { RecordPayablePaymentModal } from '../../../src/components/finance/RecordPayablePaymentModal'
import { payablesService } from '../../../src/services/payablesService'
import type { PayableDebtDetail } from '../../../src/types/payables'
import { useLiveSyncStore } from '../../../src/stores/liveSyncStore'
import { useHaptics } from '../../../src/hooks/useHaptics'
import { colors, spacing, typography } from '../../../src/theme'
import { formatCurrency, formatShortDate } from '../../../src/utils/format'
import { payableStatusLabel } from '../../../src/utils/financeLabels'

export default function PayableDebtDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const debtId = Number(id)
  const { notifySuccess, notifyError, impactLight } = useHaptics()
  const [debt, setDebt] = useState<PayableDebtDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const payablesVersion = useLiveSyncStore((s) => s.payablesVersion)

  const load = useCallback(async () => {
    if (!Number.isFinite(debtId)) return
    try {
      setDebt(await payablesService.getDebt(debtId))
    } finally {
      setLoading(false)
    }
  }, [debtId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (payablesVersion === 0) return
    void load()
  }, [payablesVersion, load])

  const sendDebt = () => {
    if (!debt) return
    Alert.alert('Envoyer la dette', `Envoyer « ${debt.label} » par email au créancier ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Envoyer',
        onPress: async () => {
          try {
            const result = await payablesService.sendDebt(debt.id, {
              email: debt.creditorEmail ?? undefined,
            })
            setFeedback(result.emailSent ? `Envoyé à ${result.sentTo}` : 'Envoi effectué.')
            await notifySuccess()
            void load()
          } catch (e) {
            await notifyError()
            setFeedback(e instanceof Error ? e.message : 'Envoi impossible.')
          }
        },
      },
    ])
  }

  const recordPayment = async (amount: number) => {
    if (!debt) return
    setSaving(true)
    try {
      await payablesService.recordPayment(debt.id, { amount })
      setPaymentOpen(false)
      setFeedback('Paiement enregistré.')
      await notifySuccess()
      void load()
    } catch (e) {
      await notifyError()
      setFeedback(e instanceof Error ? e.message : 'Paiement impossible.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.teal} />
  if (!debt) return <Text style={styles.empty}>Dette introuvable.</Text>

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Card>
        <Text style={styles.title}>{debt.label}</Text>
        <Text style={styles.line}>Créancier : {debt.creditorName}</Text>
        <Text style={styles.line}>Statut : {payableStatusLabel(debt.status)}</Text>
        <Text style={styles.line}>Échéance : {formatShortDate(debt.dueDate)}</Text>
        <Text style={styles.balance}>{formatCurrency(debt.balance, debt.currency)}</Text>
        <Text style={styles.meta}>
          Total {formatCurrency(debt.totalAmount, debt.currency)} · payé{' '}
          {formatCurrency(debt.totalPaid, debt.currency)}
        </Text>
      </Card>

      {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}

      <Button
        label="Enregistrer un paiement"
        variant="teal"
        fullWidth
        disabled={debt.balance <= 0}
        onPress={async () => {
          await impactLight()
          setPaymentOpen(true)
        }}
      />
      <Button label="Envoyer au créancier" variant="navy" fullWidth onPress={sendDebt} style={styles.btnGap} />

      <Card style={styles.paymentsCard}>
        <Text style={styles.sectionTitle}>Paiements</Text>
        {debt.payments.length === 0 && (
          <Text style={styles.emptyPayments}>Aucun paiement enregistré</Text>
        )}
        {debt.payments.map((p) => (
          <View key={p.id} style={styles.paymentRow}>
            <Text style={styles.paymentDate}>{formatShortDate(p.date)}</Text>
            <Text style={styles.paymentAmount}>{formatCurrency(p.amount, debt.currency)}</Text>
          </View>
        ))}
      </Card>

      <RecordPayablePaymentModal
        visible={paymentOpen}
        balance={debt.balance}
        currency={debt.currency}
        loading={saving}
        onClose={() => setPaymentOpen(false)}
        onSubmit={recordPayment}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { paddingBottom: spacing.xxl, gap: spacing.md },
  title: { ...typography.title, color: colors.text, marginBottom: spacing.sm },
  line: { ...typography.body, color: colors.text, marginTop: 4 },
  balance: { ...typography.kpi, color: colors.text, marginTop: spacing.md },
  meta: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  feedback: { ...typography.caption, color: colors.textMuted },
  btnGap: { marginTop: spacing.sm },
  paymentsCard: { marginTop: spacing.sm },
  sectionTitle: { ...typography.subtitle, color: colors.text, marginBottom: spacing.md },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  paymentDate: { ...typography.body, color: colors.textMuted },
  paymentAmount: { ...typography.subtitle, color: colors.text },
  emptyPayments: { ...typography.body, color: colors.textMuted },
  empty: { ...typography.body, color: colors.textMuted, marginTop: spacing.xl },
})
