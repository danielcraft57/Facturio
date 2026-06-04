import {
	buildPublicInvoiceUrl,
	buildPublicPayableDebtUrl,
	buildPublicQuoteUrl,
	resolvePublicAppBaseUrl,
} from './public-app-url';

export type TrackDocumentKind = 'invoice' | 'quote' | 'payable_debt';

export type InvoiceClickAction = 'pay' | 'view';
export type QuoteClickAction = 'accept' | 'reject';
export type PayableDebtClickAction = 'view';

const INVOICE_ACTIONS = new Set<InvoiceClickAction>(['pay', 'view']);
const QUOTE_ACTIONS = new Set<QuoteClickAction>(['accept', 'reject']);
const PAYABLE_DEBT_ACTIONS = new Set<PayableDebtClickAction>(['view']);

/** Base publique pour pixels / liens trackés (accessible depuis le client mail, pas node10.lan). */
export function resolveTrackApiBase(): string {
	const raw =
		process.env.API_PUBLIC_URL?.trim() ||
		process.env.API_URL?.trim() ||
		process.env.BACKEND_URL?.trim() ||
		`http://localhost:${process.env.PORT || 3000}`;
	return raw.replace(/\/$/, '').replace(/\/api$/i, '');
}

/** Retire les « = » issus du quoted-printable qui cassent le publicToken dans les clients mail. */
export function normalizeEmailTrackToken(token: string): string {
	return token.replace(/=/g, '');
}

export function buildEmailOpenTrackUrl(kind: TrackDocumentKind, publicToken: string): string {
	const safe = normalizeEmailTrackToken(publicToken);
	return `${resolveTrackApiBase()}/api/track/opened/${kind}/${safe}`;
}

export function buildEmailClickTrackUrl(
	kind: TrackDocumentKind,
	publicToken: string,
	action: string,
): string {
	const safe = normalizeEmailTrackToken(publicToken);
	return `${resolveTrackApiBase()}/api/track/click/${kind}/${safe}/${encodeURIComponent(action)}`;
}

export function isInvoiceClickAction(action: string): action is InvoiceClickAction {
	return INVOICE_ACTIONS.has(action as InvoiceClickAction);
}

export function isQuoteClickAction(action: string): action is QuoteClickAction {
	return QUOTE_ACTIONS.has(action as QuoteClickAction);
}

export function isPayableDebtClickAction(action: string): action is PayableDebtClickAction {
	return PAYABLE_DEBT_ACTIONS.has(action as PayableDebtClickAction);
}

export function resolveInvoiceClickRedirect(publicToken: string, _action: InvoiceClickAction): string {
	return buildPublicInvoiceUrl(publicToken);
}

export function resolveQuoteClickRedirect(publicToken: string, action: QuoteClickAction): string {
	const base = resolvePublicAppBaseUrl();
	if (action === 'accept') return `${base}/public/devis/${publicToken}/accepter`;
	return `${base}/public/devis/${publicToken}/refuser`;
}

export function resolvePayableDebtClickRedirect(publicToken: string, _action: PayableDebtClickAction): string {
	return buildPublicPayableDebtUrl(publicToken);
}

export const CLICK_ACTION_LABELS: Record<string, string> = {
	pay: 'Payer en ligne',
	view: 'Voir le détail',
	accept: 'Accepter le devis',
	reject: 'Refuser le devis',
};
