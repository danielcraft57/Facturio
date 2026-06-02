import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { Card } from '../ui/Card'
import { StatusBadge } from '../ui/StatusBadge'
import { colors, spacing, typography } from '../../theme'
import { formatCurrency, formatShortDate } from '../../utils/format'
import type { Invoice } from '../../types/invoice'

interface InvoiceListItemProps {
  invoice: Invoice
  unread?: boolean
  onPress?: () => void
}

export function InvoiceListItem({ invoice, unread, onPress }: InvoiceListItemProps) {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.titleRow}>
            {unread && <View style={styles.dot} />}
            <Text style={styles.number}>{invoice.number}</Text>
          </View>
          <StatusBadge status={invoice.status} />
        </View>
        <Text style={styles.client}>{invoice.client?.name ?? '—'}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{formatShortDate(invoice.issueDate)}</Text>
          <Text style={styles.amount}>{formatCurrency(invoice.total, invoice.currency)}</Text>
          <Feather name="download" size={16} color={colors.textMuted} />
        </View>
      </Card>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  number: {
    ...typography.subtitle,
    color: colors.text,
  },
  client: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
    flex: 1,
  },
  amount: {
    ...typography.subtitle,
    color: colors.text,
    marginRight: spacing.sm,
  },
})
