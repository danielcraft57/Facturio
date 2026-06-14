import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { Card } from '../ui/Card'
import { SwipeableRow } from '../ui/SwipeableRow'
import { colors, radius, spacing, typography } from '../../theme'
import { formatCurrency, formatShortDate } from '../../utils/format'
import {
  AGING_BUCKET_LABELS,
  RECEIVABLE_KIND_LABELS,
  agingBucketColor,
} from '../../utils/financeLabels'
import type { ReceivableInvoiceRow } from '../../types/receivables'

interface ReceivableListItemProps {
  row: ReceivableInvoiceRow
  onPress?: () => void
  onRemind?: () => void
}

export function ReceivableListItem({ row, onPress, onRemind }: ReceivableListItemProps) {
  const aging = agingBucketColor(row.agingBucket)

  const card = (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.topRow}>
          <Text style={styles.number}>{row.number}</Text>
          <View style={[styles.agingBadge, { backgroundColor: aging.bg }]}>
            <Text style={[styles.agingText, { color: aging.text }]}>
              {AGING_BUCKET_LABELS[row.agingBucket]}
            </Text>
          </View>
        </View>
        <Text style={styles.client}>{row.clientName}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            {RECEIVABLE_KIND_LABELS[row.documentKind]} · éch. {formatShortDate(row.dueDate)}
          </Text>
          <Text style={styles.balance}>{formatCurrency(row.balance)}</Text>
        </View>
        {row.daysPastDue > 0 && (
          <Text style={styles.overdue}>{row.daysPastDue} j de retard</Text>
        )}
      </Card>
    </Pressable>
  )

  return (
    <Animated.View entering={FadeInDown.duration(260)}>
      <SwipeableRow
        rightAction={
          onRemind && row.daysPastDue > 0
            ? { label: 'Relancer', variant: 'send', onPress: onRemind }
            : undefined
        }
      >
        {card}
      </SwipeableRow>
    </Animated.View>
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
  number: { ...typography.subtitle, color: colors.text },
  agingBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  agingText: { ...typography.caption, fontWeight: '700' },
  client: { ...typography.body, color: colors.textMuted, marginBottom: spacing.sm },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  meta: { ...typography.caption, color: colors.textMuted, flex: 1 },
  balance: { ...typography.subtitle, color: colors.text },
  overdue: { ...typography.caption, color: colors.error, marginTop: spacing.xs, fontWeight: '600' },
})
