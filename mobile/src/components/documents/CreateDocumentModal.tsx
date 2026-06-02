import { useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { FormModal } from '../ui/FormModal'
import { FormSection } from '../ui/FormSection'
import { FormTextField } from '../ui/FormTextField'
import { ClientAutocomplete } from '../ui/ClientAutocomplete'
import { Button } from '../ui/Button'
import { DocumentLinesEditor } from './DocumentLinesEditor'
import { DocumentTotalsCard } from './DocumentTotalsCard'
import { useCreateDocumentForm, type CreateDocumentKind } from '../../hooks/useCreateDocumentForm'
import { quotesService } from '../../services/quotesService'
import { invoicesService } from '../../services/invoicesService'
import { spacing } from '../../theme'
import { useHaptics } from '../../hooks/useHaptics'

interface CreateDocumentModalProps {
  visible: boolean
  kind: CreateDocumentKind
  onClose: () => void
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

export function CreateDocumentModal({ visible, kind, onClose, onSuccess, onError }: CreateDocumentModalProps) {
  const form = useCreateDocumentForm(kind, visible)
  const { notifySuccess, notifyError, impactLight, impactMedium } = useHaptics()
  const [submitting, setSubmitting] = useState(false)

  const isQuote = kind === 'quote'

  const handleSubmit = async () => {
    const clientId = await form.resolveClientId()
    if (!clientId || form.normalizedLines.length === 0) {
      onError('Client et au moins une ligne valide requis.')
      return
    }
    setSubmitting(true)
    try {
      if (isQuote) {
        await quotesService.createQuickDraft({
          clientId,
          expiryDate: form.expiryDate,
          lines: form.normalizedLines,
        })
        onSuccess('Devis brouillon créé.')
      } else {
        await invoicesService.createQuickDraft({
          clientId,
          dueDate: form.dueDate,
          lines: form.normalizedLines,
        })
        onSuccess('Facture brouillon créée.')
      }
      await notifySuccess()
      onClose()
    } catch (e) {
      await notifyError()
      onError(e instanceof Error ? e.message : 'Création impossible.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FormModal
      visible={visible}
      title={isQuote ? 'Nouveau devis' : 'Nouvelle facture'}
      subtitle={
        isQuote
          ? 'Client, validité, lignes HT et taux de TVA (décimal, ex. 0,2 = 20 %).'
          : 'Client, lignes de facturation, échéance et totaux HT / TVA / TTC.'
      }
      icon="file-text"
      onClose={onClose}
      footer={
        <View style={styles.footer}>
          <Button label="Annuler" variant="outline" onPress={onClose} style={styles.footerBtn} />
          <Button
            label={isQuote ? 'Créer le devis' : 'Créer la facture'}
            variant="teal"
            loading={submitting}
            disabled={!form.canSubmit}
            onPress={() => void handleSubmit()}
            style={styles.footerBtn}
          />
        </View>
      }
    >
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={styles.scroll}>
        <FormSection title="Client" icon="users">
          <ClientAutocomplete
            query={form.clientQuery}
            onChangeQuery={form.onClientQueryChange}
            suggestions={form.clientSuggestions}
            loading={form.clientsLoading}
            selectedClientId={form.selectedClientId}
            willCreateClient={form.willCreateClient}
            newClientName={form.newClientName}
            newClientEmail={form.newClientEmail}
            createError={form.createClientError}
            creatingClient={form.creatingClient}
            onSelectClient={form.selectClient}
            onChangeNewClientName={form.setNewClientName}
            onChangeNewClientEmail={form.setNewClientEmail}
            onConfirmCreateClient={() => void form.confirmCreateClient()}
            onCancelCreateClient={form.setWillCreateClient}
          />
        </FormSection>

        <FormSection title={isQuote ? 'Validité' : 'Échéances'} icon="calendar">
          <FormTextField
            label={isQuote ? 'Date limite de validité' : "Date d'échéance"}
            icon="calendar"
            value={isQuote ? form.expiryDate : form.dueDate}
            onChangeText={isQuote ? form.setExpiryDate : form.setDueDate}
            placeholder="YYYY-MM-DD"
          />
        </FormSection>

        <DocumentLinesEditor
          title={isQuote ? 'Lignes du devis' : 'Lignes de facturation'}
          lines={form.lines}
          taxLabel={form.taxLabel}
          productSuggestionsByLine={form.productSuggestionsByLine}
          onDescriptionChange={form.onDescriptionChange}
          onLineFieldChange={form.updateLine}
          onProductSelect={form.onProductSelect}
          onRemoveLine={(id) => void impactLight().then(() => form.removeLine(id))}
          onDuplicateLine={(id) => void impactMedium().then(() => form.duplicateLine(id))}
          onAddLine={form.addLine}
        />

        <DocumentTotalsCard subtotal={form.totals.subtotal} tax={form.totals.tax} total={form.totals.total} />
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </FormModal>
  )
}

const styles = StyleSheet.create({
  scroll: { maxHeight: 480 },
  footer: { flex: 1, flexDirection: 'row', gap: spacing.sm },
  footerBtn: { flex: 1 },
  bottomSpacer: { height: spacing.md },
})
