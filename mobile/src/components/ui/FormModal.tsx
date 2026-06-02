import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, radius, spacing, typography } from '../../theme'
import { useTheme } from '../../hooks/useTheme'

interface FormModalProps {
  visible: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: React.ReactNode
}

export function FormModal({ visible, title, subtitle, onClose, children }: FormModalProps) {
  const { colors: themeColors } = useTheme()
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: themeColors.text }]}>{title}</Text>
              {subtitle ? <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>{subtitle}</Text> : null}
            </View>
            <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: themeColors.background }]}>
              <Text style={[styles.closeText, { color: themeColors.text }]}>×</Text>
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.48)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  title: { ...typography.title, color: colors.text, fontSize: 20 },
  subtitle: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  closeText: { color: colors.text, fontSize: 20, lineHeight: 22 },
})
