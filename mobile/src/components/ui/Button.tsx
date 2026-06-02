import { Pressable, StyleSheet, Text, View, type PressableProps, ActivityIndicator } from 'react-native'
import { colors, radius, spacing, typography } from '../../theme'
import { useTheme } from '../../hooks/useTheme'

type Variant = 'teal' | 'navy' | 'outline' | 'ghost'

interface ButtonProps extends PressableProps {
  label: string
  variant?: Variant
  loading?: boolean
  fullWidth?: boolean
}

export function Button({ label, variant = 'teal', loading, fullWidth, disabled, style, ...rest }: ButtonProps) {
  const { colors: themeColors } = useTheme()
  const isDisabled = disabled || loading

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={(state) => [
        styles.base,
        styles[variant],
        variant === 'teal' && { backgroundColor: themeColors.teal },
        variant === 'navy' && { backgroundColor: themeColors.navy },
        variant === 'outline' && { borderColor: themeColors.border },
        fullWidth && styles.fullWidth,
        state.pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? themeColors.teal : themeColors.surface} />
      ) : (
        <Text
          style={[
            styles.label,
            styles[`${variant}Label` as keyof typeof styles],
            variant === 'teal' && { color: themeColors.surface },
            variant === 'outline' && { color: themeColors.text },
            variant === 'ghost' && { color: themeColors.primary },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  fullWidth: { alignSelf: 'stretch' },
  pressed: { opacity: 0.88 },
  disabled: { opacity: 0.5 },
  label: { ...typography.subtitle, fontSize: 16 },
  teal: { backgroundColor: colors.teal },
  navy: { backgroundColor: colors.navy },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  ghost: { backgroundColor: 'transparent' },
  tealLabel: { color: colors.surface },
  navyLabel: { color: colors.textOnDark },
  outlineLabel: { color: colors.text },
  ghostLabel: { color: colors.primary },
})
