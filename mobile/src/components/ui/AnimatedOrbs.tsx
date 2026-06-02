import { StyleSheet, View } from 'react-native'
import { useEffect } from 'react'
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { colors } from '../../theme'

export function AnimatedOrbs() {
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 4800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    )
  }, [progress])

  const orbA = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [-16, 22]) },
      { translateY: interpolate(progress.value, [0, 1], [12, -10]) },
      { scale: interpolate(progress.value, [0, 1], [1, 1.08]) },
    ],
    opacity: interpolate(progress.value, [0, 1], [0.2, 0.34]),
  }))

  const orbB = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [24, -18]) },
      { translateY: interpolate(progress.value, [0, 1], [-8, 16]) },
      { scale: interpolate(progress.value, [0, 1], [1, 1.1]) },
    ],
    opacity: interpolate(progress.value, [0, 1], [0.12, 0.26]),
  }))

  return (
    <View pointerEvents="none" style={styles.wrap}>
      <Animated.View style={[styles.orb, styles.orbA, orbA]} />
      <Animated.View style={[styles.orb, styles.orbB, orbB]} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbA: {
    width: 220,
    height: 220,
    right: -40,
    top: 32,
    backgroundColor: colors.teal,
  },
  orbB: {
    width: 180,
    height: 180,
    left: -30,
    bottom: 40,
    backgroundColor: '#0EA5E9',
  },
})
