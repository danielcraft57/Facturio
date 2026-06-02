import { StyleSheet, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { Card } from './Card'
import { colors, radius, spacing, typography } from '../../theme'
import { formatPercent } from '../../utils/format'

interface MetricCardProps {
  label: string
  value: string
  trend?: number
  icon: keyof typeof Feather.glyphMap
  iconBg: string
  iconColor: string
}

export function MetricCard({ label, value, trend, icon, iconBg, iconColor }: MetricCardProps) {
  const trendPositive = trend != null && trend >= 0

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
          <Feather name={icon} size={20} color={iconColor} />
        </View>
        {trend != null && (
          <Text style={[styles.trend, { color: trendPositive ? colors.success : colors.error }]}>
            {formatPercent(trend)}
          </Text>
        )}
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 150 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 4,
  },
  value: {
    ...typography.kpi,
    color: colors.text,
  },
  trend: {
    ...typography.caption,
    fontWeight: '700',
  },
})
