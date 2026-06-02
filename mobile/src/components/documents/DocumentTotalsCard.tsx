import { StyleSheet, Text, View } from 'react-native'
import { colors, radius, spacing, typography } from '../../theme'
import { useTheme } from '../../hooks/useTheme'
import { formatCurrency } from '../../utils/format'

interface DocumentTotalsCardProps {
  subtotal: number
  tax: number
  total: number
}

export function DocumentTotalsCard({ subtotal, tax, total }: DocumentTotalsCardProps) {
  const { colors: themeColors } = useTheme()
  return (
    <View style={[styles.box, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
      <Row label="Total HT" value={formatCurrency(subtotal, 'EUR')} muted />
      <Row label="TVA" value={formatCurrency(tax, 'EUR')} muted />
      <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
      <Row label="Total TTC" value={formatCurrency(total, 'EUR')} bold />
    </View>
  )
}

function Row({ label, value, muted, bold }: { label: string; value: string; muted?: boolean; bold?: boolean }) {
  const { colors: themeColors } = useTheme()
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: themeColors.textMuted }, bold && styles.labelBold]}>{label}</Text>
      <Text
        style={[
          styles.value,
          { color: themeColors.text },
          muted && { color: themeColors.textMuted },
          bold && styles.valueBold,
        ]}
      >
        {value}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    alignSelf: 'flex-end',
    minWidth: 220,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { ...typography.caption, color: colors.textMuted },
  labelBold: { ...typography.body, color: colors.text, fontWeight: '700' },
  value: { ...typography.caption, color: colors.text },
  valueBold: { ...typography.subtitle, fontWeight: '700' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 6 },
})
