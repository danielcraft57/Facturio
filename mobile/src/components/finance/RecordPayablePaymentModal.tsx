import { useState } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { FormModal } from '../ui/FormModal'
import { Button } from '../ui/Button'
import { colors, radius, spacing, typography } from '../../theme'
import { useTheme } from '../../hooks/useTheme'
import { formatCurrency } from '../../utils/format'

interface RecordPayablePaymentModalProps {
  visible: boolean
  balance: number
  currency?: string
  loading?: boolean
  onClose: () => void
  onSubmit: (amount: number) => void
}

export function RecordPayablePaymentModal({
  visible,
  balance,
  currency = 'EUR',
  loading,
  onClose,
  onSubmit,
}: RecordPayablePaymentModalProps) {
  const { colors: themeColors } = useTheme()
  const [amountText, setAmountText] = useState(String(balance.toFixed(2)))

  const parsed = Number.parseFloat(amountText.replace(',', '.'))
  const valid = Number.isFinite(parsed) && parsed > 0 && parsed <= balance + 0.01

  return (
    <FormModal
      visible={visible}
      title="Enregistrer un paiement"
      subtitle={`Solde restant : ${formatCurrency(balance, currency)}`}
      icon="credit-card"
      onClose={onClose}
      footer={
        <View style={styles.footer}>
          <Button label="Annuler" variant="ghost" onPress={onClose} />
          <Button
            label="Enregistrer"
            variant="teal"
            loading={loading}
            disabled={!valid}
            onPress={() => onSubmit(parsed)}
          />
        </View>
      }
    >
      <Text style={styles.label}>Montant (€)</Text>
      <TextInput
        value={amountText}
        onChangeText={setAmountText}
        keyboardType="decimal-pad"
        style={[
          styles.input,
          { borderColor: themeColors.border, backgroundColor: themeColors.background, color: themeColors.text },
        ]}
        placeholder="0,00"
        placeholderTextColor={themeColors.textMuted}
      />
    </FormModal>
  )
}

const styles = StyleSheet.create({
  label: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
})
