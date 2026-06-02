import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { colors, radius, spacing, typography } from '../../theme'

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
  return (
    <View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
      />
      {options.length > 0 ? (
        <View style={styles.list}>
          {options.map((option) => (
            <Pressable key={option.id} style={styles.option} onPress={() => onSelect(option)}>
              <Text style={styles.optionLabel}>{option.label}</Text>
              {option.hint ? <Text style={styles.optionHint}>{option.hint}</Text> : null}
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
