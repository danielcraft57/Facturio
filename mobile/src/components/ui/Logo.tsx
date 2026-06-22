import { StyleSheet, Text, View } from 'react-native'
import { colors, radius, typography } from '../../theme'

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.row}>
      <View style={styles.mark}>
        <Text style={styles.markText}>F</Text>
      </View>
      {!compact && <Text style={styles.wordmark}>PrestaFacture</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mark: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markText: {
    color: colors.surface,
    fontSize: 20,
    fontWeight: '800',
  },
  wordmark: {
    ...typography.title,
    color: colors.textOnDark,
  },
})
