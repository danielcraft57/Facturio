import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { colors, radius, spacing, typography } from '../../theme'
import { useTheme } from '../../hooks/useTheme'

export interface AutocompleteOption {
  id: string
  label: string
  hint?: string
}

interface AutocompleteInputProps {
  value: string
  onChangeText: (value: string) => void
  placeholder?: string
  options: AutocompleteOption[]
  onSelect: (option: AutocompleteOption) => void
}

export function AutocompleteInput({
  value,
  onChangeText,
  placeholder,
  options,
  onSelect,
}: AutocompleteInputProps) {
  const { colors: themeColors } = useTheme()
  return (
    <View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={themeColors.textMuted}
        style={[styles.input, { color: themeColors.text, borderColor: themeColors.border, backgroundColor: themeColors.background }]}
      />
      {options.length > 0 ? (
        <View style={[styles.list, { borderColor: themeColors.border, backgroundColor: themeColors.surface }]}>
          {options.map((option) => (
            <Pressable
              key={option.id}
              style={[styles.option, { borderBottomColor: themeColors.border }]}
              onPress={() => onSelect(option)}
            >
              <Text style={[styles.optionLabel, { color: themeColors.text }]}>{option.label}</Text>
              {option.hint ? <Text style={[styles.optionHint, { color: themeColors.textMuted }]}>{option.hint}</Text> : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.background,
  },
  list: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  option: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionLabel: { ...typography.body, color: colors.text, fontSize: 14 },
  optionHint: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
})
