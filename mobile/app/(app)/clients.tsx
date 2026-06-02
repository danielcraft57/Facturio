import { StyleSheet, Text, View } from 'react-native'
import { Card } from '../../src/components/ui/Card'
import { colors, typography } from '../../src/theme'

export default function ClientsPlaceholder() {
  return (
    <View>
      <Card>
        <Text style={styles.text}>Écran clients à venir (GET /clients).</Text>
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  text: { ...typography.body, color: colors.textMuted },
})
