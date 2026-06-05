import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, radius, typography } from '../../theme'

export type SwipeActionVariant = 'delete' | 'archive' | 'duplicate' | 'send'

export interface SwipeActionConfig {
  label: string
  variant: SwipeActionVariant
  onPress: () => void
  disabled?: boolean
}

interface SwipeableRowProps {
  children: React.ReactNode
  leftAction?: SwipeActionConfig
  rightAction?: SwipeActionConfig
  /** Sur web : appui long déclenche l’action droite (dupliquer) si présente */
  onWebLongPress?: () => void
}

const variantStyle: Record<SwipeActionVariant, { bg: string; border: string }> = {
  delete: { bg: colors.errorBg, border: colors.error },
  archive: { bg: colors.warningBg, border: colors.warning },
  duplicate: { bg: colors.infoBg, border: colors.info },
  send: { bg: colors.successBg, border: colors.success },
}

function ActionPanel({ action }: { action: SwipeActionConfig }) {
  const palette = variantStyle[action.variant]
  return (
    <View
      style={[
        styles.action,
        { backgroundColor: palette.bg, borderColor: palette.border },
        action.disabled && styles.actionDisabled,
      ]}
    >
      <Text style={styles.actionText}>{action.label}</Text>
    </View>
  )
}

export function SwipeableRow({ children, leftAction, rightAction, onWebLongPress }: SwipeableRowProps) {
  const isWeb = Platform.OS === 'web'
  const hasSwipe = !isWeb && (leftAction || rightAction)

  if (!hasSwipe) {
    return (
      <Pressable onLongPress={onWebLongPress} disabled={!onWebLongPress}>
        {children}
      </Pressable>
    )
  }

  const { Swipeable } = require('react-native-gesture-handler') as typeof import('react-native-gesture-handler')

  return (
    <Swipeable
      renderLeftActions={leftAction ? () => <ActionPanel action={leftAction} /> : undefined}
      renderRightActions={rightAction ? () => <ActionPanel action={rightAction} /> : undefined}
      onSwipeableLeftOpen={() => {
        if (leftAction?.disabled) return
        leftAction?.onPress()
      }}
      onSwipeableRightOpen={() => {
        if (rightAction?.disabled) return
        rightAction?.onPress()
      }}
      overshootLeft={false}
      overshootRight={false}
    >
      {children}
    </Swipeable>
  )
}

const styles = StyleSheet.create({
  action: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 112,
    borderRadius: radius.md,
    marginVertical: 2,
    borderWidth: 1,
    paddingHorizontal: 8,
  },
  actionDisabled: { opacity: 0.45 },
  actionText: { ...typography.caption, fontWeight: '700', color: colors.text, textAlign: 'center' },
})
