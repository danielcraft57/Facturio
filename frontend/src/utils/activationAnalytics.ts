import { GA_EVENTS, trackActivationEvent } from '../config/analyticsEvents'
import { markFirstPdfTracked, wasFirstPdfTracked } from './accountActivationStorage'

export type PdfDownloadDocumentType = 'invoice' | 'quote'

/**
 * Envoie l'événement GA4 `first_pdf_downloaded` une seule fois par appareil.
 *
 * @param options.documentType - Type de document téléchargé
 * @param options.documentId - Identifiant du document
 */
export function trackFirstPdfDownloadedIfNeeded(options: {
  documentType: PdfDownloadDocumentType
  documentId: string
}): void {
  if (wasFirstPdfTracked()) return
  markFirstPdfTracked()
  trackActivationEvent(GA_EVENTS.FIRST_PDF_DOWNLOADED, {
    document_type: options.documentType,
    document_id: options.documentId,
  })
}
