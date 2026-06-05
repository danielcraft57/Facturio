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
import { colors, radius } from '../../theme'

interface ShimmerBlockProps {
  height: number
  width?: number | `${number}%`
  radiusSize?: number
}

export function ShimmerBlock({ height, width = '100%', radiusSize = radius.md }: ShimmerBlockProps) {
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    )
  }, [progress])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.45, 0.95]),
  }))

  return (
    <Animated.View
      style={[
        styles.block,
        animatedStyle,
        { height, width, borderRadius: radiusSize },
      ]}
    />
  )
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: colors.border,
  },
})
