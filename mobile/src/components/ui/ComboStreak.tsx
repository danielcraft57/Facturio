import { StyleSheet, Text, View } from 'react-native'
import Animated, { FadeInDown, FadeOutUp, ZoomIn } from 'react-native-reanimated'
import { colors, radius, spacing, typography } from '../../theme'

interface ComboStreakProps {
  value: number
}

export function ComboStreak({ value }: ComboStreakProps) {
  if (value <= 0) return null

  const tone = value >= 5 ? '#A855F7' : value >= 3 ? colors.teal : colors.primary
  return (
    <Animated.View entering={ZoomIn.duration(220)} exiting={FadeOutUp.duration(220)} style={styles.wrap}>
      <Animated.View entering={FadeInDown.duration(240)} style={[styles.badge, { borderColor: tone }]}>
        <View style={[styles.dot, { backgroundColor: tone }]} />
        <Text style={styles.label}>Combo x{value}</Text>
        <Text style={[styles.sub, { color: tone }]}>+XP fluidité</Text>
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginVertical: spacing.sm },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { ...typography.subtitle, color: colors.text, fontSize: 14 },
  sub: { ...typography.caption, marginLeft: 'auto', fontWeight: '700' },
})
