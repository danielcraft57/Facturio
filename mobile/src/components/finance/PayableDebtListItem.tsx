import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { Card } from '../ui/Card'
import { SwipeableRow } from '../ui/SwipeableRow'
import { colors, radius, spacing, typography } from '../../theme'
import { formatCurrency, formatShortDate } from '../../utils/format'
import { payableStatusLabel } from '../../utils/financeLabels'
import type { PayableDebtRow } from '../../types/payables'

interface PayableDebtListItemProps {
  debt: PayableDebtRow
  onPress?: () => void
  onArchive?: () => void
}

export function PayableDebtListItem({ debt, onPress, onArchive }: PayableDebtListItemProps) {
  const card = (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.topRow}>
          <Text style={styles.label} numberOfLines={1}>
            {debt.label}
          </Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{payableStatusLabel(debt.status)}</Text>
          </View>
        </View>
        <Text style={styles.creditor}>{debt.creditorName}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>Éch. {formatShortDate(debt.dueDate)}</Text>
          <Text style={styles.balance}>{formatCurrency(debt.balance, debt.currency)}</Text>
        </View>
      </Card>
    </Pressable>
  )

  return (
    <Animated.View entering={FadeInDown.duration(260)}>
      <SwipeableRow
        leftAction={
          onArchive ? { label: 'Archiver', variant: 'archive', onPress: onArchive } : undefined
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
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  label: { ...typography.subtitle, color: colors.text, flex: 1 },
  statusBadge: {
    backgroundColor: colors.infoBg,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: { ...typography.caption, color: colors.info, fontWeight: '600' },
  creditor: { ...typography.body, color: colors.textMuted, marginBottom: spacing.sm },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  meta: { ...typography.caption, color: colors.textMuted },
  balance: { ...typography.subtitle, color: colors.text },
})
