import { StyleSheet, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors, spacing, typography } from '../../theme'
import { useTheme } from '../../hooks/useTheme'

interface FormSectionProps {
  title: string
  helper?: string
  icon?: keyof typeof Feather.glyphMap
  children: React.ReactNode
}

export function FormSection({ title, helper, icon, children }: FormSectionProps) {
  const { colors: themeColors } = useTheme()
  return (
    <View style={styles.section}>
      <View style={styles.titleRow}>
        {icon ? <Feather name={icon} size={14} color={themeColors.teal} /> : null}
        <Text style={[styles.title, { color: themeColors.textMuted }]}>{title}</Text>
      </View>
      {helper ? <Text style={[styles.helper, { color: themeColors.textMuted }]}>{helper}</Text> : null}
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  title: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  helper: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm },
})
