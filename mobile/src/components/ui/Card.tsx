import { StyleSheet, View, type ViewProps } from 'react-native'
import { colors, radius, spacing } from '../../theme'

interface CardProps extends ViewProps {
  padded?: boolean
}

export function Card({ children, padded = true, style, ...rest }: CardProps) {
  return (
    <View style={[styles.card, padded && styles.padded, style]} {...rest}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  padded: {
    padding: spacing.md,
  },
})
