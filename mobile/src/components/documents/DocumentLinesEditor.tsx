import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { AutocompleteInput, type AutocompleteOption } from '../ui/AutocompleteInput'
import { SwipeableRow } from '../ui/SwipeableRow'
import { colors, radius, spacing, typography } from '../../theme'
import { useTheme } from '../../hooks/useTheme'
import type { ProductSuggestion } from '../../services/productsService'

export interface DocumentDraftLine {
  id: string
  description: string
  quantity: string
  unitPrice: string
  taxRate: string
}

interface DocumentLinesEditorProps {
  title: string
  lines: DocumentDraftLine[]
  taxLabel: string
  productSuggestionsByLine: Record<string, ProductSuggestion[]>
  onDescriptionChange: (lineId: string, value: string) => void
  onLineFieldChange: (lineId: string, patch: Partial<DocumentDraftLine>) => void
  onProductSelect: (lineId: string, product: ProductSuggestion) => void
  onRemoveLine: (lineId: string) => void
  onDuplicateLine: (lineId: string) => void
  onAddLine: () => void
}

export function DocumentLinesEditor({
  title,
  lines,
  taxLabel,
  productSuggestionsByLine,
  onDescriptionChange,
  onLineFieldChange,
  onProductSelect,
  onRemoveLine,
  onDuplicateLine,
  onAddLine,
}: DocumentLinesEditorProps) {
  const { colors: themeColors } = useTheme()
  const isWeb = Platform.OS === 'web'

  return (
    <View>
      <View style={styles.headRow}>
        <Feather name="list" size={14} color={themeColors.teal} />
        <Text style={[styles.sectionTitle, { color: themeColors.textMuted }]}>{title}</Text>
      </View>
      <View style={[styles.tableHead, { borderBottomColor: themeColors.border }]}>
        <Text style={[styles.colDesc, styles.colHead, { color: themeColors.textMuted }]}>Description</Text>
        <Text style={[styles.colPrice, styles.colHead, { color: themeColors.textMuted }]}>Prix unit.</Text>
        <Text style={[styles.colTax, styles.colHead, { color: themeColors.textMuted }]}>{taxLabel}</Text>
        <View style={styles.colAction} />
      </View>

      {lines.map((line, index) => {
        const content = (
          <View style={[styles.lineCard, { borderColor: themeColors.border, backgroundColor: themeColors.surface }]}>
            <AutocompleteInput
              value={line.description}
              onChangeText={(value) => onDescriptionChange(line.id, value)}
              placeholder="Produit ou prestation"
              options={(productSuggestionsByLine[line.id] ?? []).map<AutocompleteOption>((p) => ({
                id: String(p.id),
                label: p.name,
                hint: typeof p.unitPrice === 'number' ? `${p.unitPrice.toFixed(2)} €` : undefined,
              }))}
              onSelect={(option) => {
                const selected = (productSuggestionsByLine[line.id] ?? []).find((p) => String(p.id) === option.id)
                if (selected) onProductSelect(line.id, selected)
              }}
            />
            <View style={styles.numericRow}>
              <View style={styles.colPriceField}>
                <TextInput
                  value={line.unitPrice}
                  onChangeText={(value) => onLineFieldChange(line.id, { unitPrice: value })}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={themeColors.textMuted}
                  style={[styles.numInput, { color: themeColors.text, borderColor: themeColors.border }]}
                />
              </View>
              <View style={styles.colTaxField}>
                <TextInput
                  value={line.taxRate}
                  onChangeText={(value) => onLineFieldChange(line.id, { taxRate: value })}
                  keyboardType="decimal-pad"
                  placeholder="0,2"
                  placeholderTextColor={themeColors.textMuted}
                  style={[styles.numInput, { color: themeColors.text, borderColor: themeColors.border }]}
                />
              </View>
              <Pressable
                onPress={() => onRemoveLine(line.id)}
                disabled={lines.length <= 1}
                style={[styles.deleteBtn, lines.length <= 1 && styles.deleteDisabled]}
                accessibilityLabel={`Supprimer la ligne ${index + 1}`}
              >
                <Feather name="trash-2" size={18} color={lines.length <= 1 ? themeColors.textMuted : colors.error} />
              </Pressable>
            </View>
          </View>
        )

        if (isWeb) {
          return (
            <Pressable key={line.id} onLongPress={() => onDuplicateLine(line.id)} style={styles.lineWrap}>
              {content}
            </Pressable>
          )
        }

        return (
          <View key={line.id} style={styles.lineWrap}>
            <SwipeableRow
              leftAction={{
                label: 'Retirer',
                variant: 'delete',
                disabled: lines.length <= 1,
                onPress: () => onRemoveLine(line.id),
              }}
              rightAction={{
                label: 'Dupliquer',
                variant: 'duplicate',
                onPress: () => onDuplicateLine(line.id),
              }}
              onWebLongPress={() => onDuplicateLine(line.id)}
            >
              {content}
            </SwipeableRow>
          </View>
        )
      })}

      <Pressable onPress={onAddLine} style={styles.addRow}>
        <Feather name="plus-circle" size={18} color={themeColors.primary} />
        <Text style={[styles.addText, { color: themeColors.primary }]}>Ajouter une ligne</Text>
      </Pressable>
      {!isWeb ? (
        <Text style={[styles.swipeHint, { color: themeColors.textMuted }]}>
          Glisser une ligne : gauche = retirer, droite = dupliquer
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6,
    borderBottomWidth: 1,
    marginBottom: spacing.sm,
  },
  colHead: { ...typography.caption, fontWeight: '600' },
  colDesc: { flex: 1 },
  colPrice: { width: 72, textAlign: 'right', paddingRight: 4 },
  colTax: { width: 64, textAlign: 'right', paddingRight: 4 },
  colAction: { width: 36 },
  lineWrap: { marginBottom: spacing.sm },
  lineCard: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  numericRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  colPriceField: { width: 88 },
  colTaxField: { width: 72 },
  numInput: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    ...typography.body,
    textAlign: 'right',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  deleteDisabled: { opacity: 0.35 },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.sm,
  },
  addText: { ...typography.body, fontWeight: '600' },
  swipeHint: { ...typography.caption, textAlign: 'center', marginTop: 2 },
})
