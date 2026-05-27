import { parseTagsJson } from '../common/document-folder.util';

/** Règles d'accès page publique / paiement Stripe par token. */
export function canAccessInvoiceByPublicToken(invoice: {
	sentAt: Date | null;
	status: string;
	tags: string | null;
	publicToken: string | null;
}): boolean {
	if (!invoice.publicToken) return false;
	if (invoice.sentAt) return true;
	const tags = parseTagsJson(invoice.tags);
	if (invoice.status === 'PAID') return true;
	if (tags.includes('SOLDE_APRES_ACOMPTE')) return true;
	if (tags.includes('ACOMPTE_10')) return true;
	return false;
}
