import { parseTagsJson } from '../common/document-folder.util';
import { parseQuoteIdFromSplitTags } from '../invoices/invoice-deposit.util';

export type ReceivableDocumentKind = 'standard' | 'deposit' | 'remainder' | 'installment';

export const RECEIVABLE_DOCUMENT_KIND_LABELS: Record<ReceivableDocumentKind, string> = {
	standard: 'Facture',
	deposit: 'Acompte',
	remainder: 'Solde',
	installment: 'Échéancier',
};

export function resolveReceivableDocumentKind(tagsRaw: string | null | undefined): ReceivableDocumentKind {
	const tags = parseTagsJson(tagsRaw);
	if (tags.includes('ACOMPTE_10')) return 'deposit';
	if (tags.includes('SOLDE_APRES_ACOMPTE')) return 'remainder';
	if (tags.includes('ECHEANCIER')) return 'installment';
	return 'standard';
}

export function resolveReceivableQuoteId(
	tagsRaw: string | null | undefined,
	sourceQuoteId: string | null | undefined,
): string | null {
	if (sourceQuoteId) return sourceQuoteId;
	return parseQuoteIdFromSplitTags(parseTagsJson(tagsRaw));
}
