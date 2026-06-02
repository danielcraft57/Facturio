import { StyleSheet, Text, View } from 'react-native'
import { invoiceStatusColors, radius, typography } from '../../theme'
import type { InvoiceStatus } from '../../types/invoice'

interface StatusBadgeProps {
  status: InvoiceStatus | string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const key = status.toLowerCase() as keyof typeof invoiceStatusColors
  const palette = invoiceStatusColors[key] ?? invoiceStatusColors.draft

  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, { color: palette.text }]}>{palette.label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    ...typography.caption,
    fontWeight: '600',
  },
})
