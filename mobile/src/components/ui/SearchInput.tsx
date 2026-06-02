import { StyleSheet, TextInput, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors, radius, spacing, typography } from '../../theme'
import { useTheme } from '../../hooks/useTheme'

interface SearchInputProps {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
}

export function SearchInput({ value, onChangeText, placeholder = 'Rechercher…' }: SearchInputProps) {
  const { colors: themeColors } = useTheme()
  return (
    <View style={[styles.wrap, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
      <Feather name="search" size={18} color={themeColors.textMuted} style={styles.icon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={themeColors.textMuted}
        style={[styles.input, { color: themeColors.text }]}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  icon: { marginRight: spacing.sm },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
})
