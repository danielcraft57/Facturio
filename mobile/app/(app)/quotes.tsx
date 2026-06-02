import { StyleSheet, Text, View } from 'react-native'
import { ScreenHeader } from '../../src/components/ui/ScreenHeader'
import { Card } from '../../src/components/ui/Card'
import { colors, spacing, typography } from '../../src/theme'

export default function QuotesPlaceholder() {
  return (
    <View>
      <ScreenHeader title="Devis" subtitle="Phase 1 — liste en lecture seule" />
      <Card>
        <Text style={styles.text}>Écran devis à venir (GET /quotes).</Text>
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  text: { ...typography.body, color: colors.textMuted },
})
