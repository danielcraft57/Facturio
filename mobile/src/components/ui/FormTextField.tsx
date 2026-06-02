import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors, radius, spacing, typography } from '../../theme'
import { useTheme } from '../../hooks/useTheme'

interface FormTextFieldProps extends TextInputProps {
  label: string
  icon?: keyof typeof Feather.glyphMap
}

export function FormTextField({ label, icon, style, ...rest }: FormTextFieldProps) {
  const { colors: themeColors } = useTheme()
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: themeColors.textMuted }]}>{label}</Text>
      <View style={[styles.inputRow, { borderColor: themeColors.border, backgroundColor: themeColors.background }]}>
        {icon ? <Feather name={icon} size={16} color={themeColors.textMuted} style={styles.icon} /> : null}
        <TextInput
          placeholderTextColor={themeColors.textMuted}
          style={[styles.input, { color: themeColors.text }, style]}
          {...rest}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  label: { ...typography.caption, color: colors.textMuted, marginBottom: 4, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
  },
  icon: { marginRight: spacing.sm },
  input: {
    flex: 1,
    paddingVertical: 12,
    ...typography.body,
    color: colors.text,
  },
})
