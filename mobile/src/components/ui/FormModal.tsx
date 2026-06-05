import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors, radius, spacing, typography } from '../../theme'
import { useTheme } from '../../hooks/useTheme'

interface FormModalProps {
  visible: boolean
  title: string
  subtitle?: string
  icon?: keyof typeof Feather.glyphMap
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
}

export function FormModal({ visible, title, subtitle, icon, onClose, children, footer }: FormModalProps) {
  const { colors: themeColors } = useTheme()
  const { height } = useWindowDimensions()
  const maxCardHeight = Math.min(height * 0.92, 720)

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.card,
            { backgroundColor: themeColors.surface, borderColor: themeColors.border, maxHeight: maxCardHeight },
          ]}
        >
          <View style={styles.header}>
            {icon ? (
              <View style={[styles.iconWrap, { backgroundColor: themeColors.navy }]}>
                <Feather name={icon} size={20} color={themeColors.textOnDark} />
              </View>
            ) : null}
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: themeColors.text }]}>{title}</Text>
              {subtitle ? <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>{subtitle}</Text> : null}
            </View>
            <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: themeColors.background }]}>
              <Feather name="x" size={18} color={themeColors.text} />
            </Pressable>
          </View>
          <View style={styles.body}>{children}</View>
          {footer ? <View style={[styles.footer, { borderTopColor: themeColors.border }]}>{footer}</View> : null}
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
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navy,
  },
  title: { ...typography.title, color: colors.text, fontSize: 20 },
  subtitle: { ...typography.caption, color: colors.textMuted, marginTop: 4, lineHeight: 18 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: spacing.lg,
    flexShrink: 1,
  },
  footer: {
    borderTopWidth: 1,
    padding: spacing.lg,
  },
})
