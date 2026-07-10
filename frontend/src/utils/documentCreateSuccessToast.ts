/** Type de document créé (toast succès + prochaine étape). */
export type DocumentCreateKind = 'facture' | 'devis' | 'client'

/** Durée par défaut des toasts post-création. */
export const DOCUMENT_CREATE_TOAST_DURATION_MS = 12_000

/**
 * Message de prochaine étape après création d'un document ou client.
 *
 * @param kind - Nature de l'entité créée
 */
export function getDocumentCreateSuccessMessage(kind: DocumentCreateKind): string {
  switch (kind) {
    case 'facture':
      return "Envoyez-la à votre client — le formulaire d'envoi s'ouvre."
    case 'devis':
      return "Envoyez-le à votre client — le formulaire d'envoi s'ouvre."
    case 'client':
      return 'Prochaine étape : créez un devis ou une facture pour ce client.'
    default:
      return 'Document créé.'
  }
}

/**
 * Titre du toast succès après création.
 *
 * @param kind - Nature de l'entité
 * @param label - Libellé affiché (n° facture, nom client…)
 */
export function getDocumentCreateSuccessTitle(kind: DocumentCreateKind, label: string): string {
  switch (kind) {
    case 'facture':
      return `Facture ${label} créée`
    case 'devis':
      return `Devis ${label} créé`
    case 'client':
      return `Client « ${label} » créé`
    default:
      return label
  }
}
