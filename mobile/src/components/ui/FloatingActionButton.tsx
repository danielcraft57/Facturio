import { Platform, Pressable, StyleSheet, Text } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useEffect } from 'react'
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { colors, radius, spacing, typography } from '../../theme'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

interface FloatingActionButtonProps {
  label: string
  icon?: keyof typeof Feather.glyphMap
  onPress: () => void
}

export function FloatingActionButton({ label, icon = 'plus', onPress }: FloatingActionButtonProps) {
  const scale = useSharedValue(1)
  const pulse = useSharedValue(0)

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    )
  }, [pulse])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.16]) }],
    opacity: interpolate(pulse.value, [0, 1], [0.26, 0.05]),
  }))

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(pulse.value, [0, 1], [-8, 8])}deg` }],
  }))

  return (
    <>
      <Animated.View style={[styles.glow, glowStyle, { pointerEvents: 'none' }]} />
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.95) }}
        onPressOut={() => { scale.value = withSpring(1) }}
        style={[styles.fab, animatedStyle]}
      >
        <Animated.View style={iconStyle}>
          <Feather name={icon} size={18} color={colors.surface} />
        </Animated.View>
        <Text style={styles.label}>{label}</Text>
      </AnimatedPressable>
    </>
  )
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    width: 148,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    ...Platform.select({
      web: { boxShadow: '0px 8px 18px rgba(15, 23, 42, 0.24)' },
      default: {
        shadowColor: '#0F172A',
        shadowOpacity: 0.2,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 5,
      },
    }),
  },
  label: {
    ...typography.caption,
    color: colors.surface,
    fontWeight: '700',
  },
})
