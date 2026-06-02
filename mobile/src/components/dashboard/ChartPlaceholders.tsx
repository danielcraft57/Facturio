import type { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Svg, { Circle, Line, Polyline } from 'react-native-svg'
import { Card } from '../ui/Card'
import { colors, spacing, typography } from '../../theme'

interface SimpleLineChartProps {
  title: string
  labels: string[]
  values: number[]
}

export function SimpleLineChart({ title, labels, values }: SimpleLineChartProps) {
  const width = 280
  const height = 120
  const max = Math.max(...values, 1)
  const points = values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * (width - 20) + 10
      const y = height - 20 - (v / max) * (height - 40)
      return `${x},${y}`
    })
    .join(' ')

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Line x1="10" y1={height - 20} x2={width - 10} y2={height - 20} stroke={colors.border} />
        <Polyline points={points} fill="none" stroke={colors.teal} strokeWidth="3" />
      </Svg>
      <Text style={styles.caption}>{labels.slice(-2).join(' · ')}</Text>
    </Card>
  )
}

interface DonutChartProps {
  title: string
  segments: Array<{ label: string; value: number; color: string }>
}

export function DonutChart({ title, segments }: DonutChartProps) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.donutRow}>
        <Svg width={100} height={100} viewBox="0 0 100 100">
          {segments.reduce<{ offset: number; nodes: ReactNode[] }>(
            (acc, seg, i) => {
              const pct = seg.value / total
              const dash = pct * 251
              acc.nodes.push(
                <Circle
                  key={seg.label}
                  cx="50"
                  cy="50"
                  r="40"
                  stroke={seg.color}
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${dash} 251`}
                  strokeDashoffset={-acc.offset}
                  rotation="-90"
                  origin="50, 50"
                />,
              )
              acc.offset += dash
              return acc
            },
            { offset: 0, nodes: [] },
          ).nodes}
        </Svg>
        <View style={styles.legend}>
          {segments.map((seg) => (
            <View key={seg.label} style={styles.legendRow}>
              <View style={[styles.swatch, { backgroundColor: seg.color }]} />
              <Text style={styles.legendText}>
                {seg.label} · {Math.round((seg.value / total) * 100)} %
              </Text>
            </View>
          ))}
        </View>
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 260 },
  title: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.md,
  },
  caption: {
    ...typography.caption,
    color: colors.textMuted,
  },
  donutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  legend: { flex: 1, gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  swatch: { width: 10, height: 10, borderRadius: 5 },
  legendText: {
    ...typography.caption,
    color: colors.textMuted,
  },
})
