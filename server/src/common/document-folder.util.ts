/** Dossiers de classement pour documents émis (factures / devis / dettes). */
export type DocumentMailboxFolder =
	| 'inbox'
	| 'nouveau'
	| 'suivi'
	| 'attente'
	| 'important'
	| 'envoyes'
	| 'brouillons';

export type DocumentStatusFolder =
	| 'status_draft'
	| 'status_sent'
	| 'status_viewed'
	| 'status_clicked'
	| 'status_accepted'
	| 'status_rejected'
	| 'status_expired'
	| 'status_overdue'
	| 'status_paid'
	| 'status_cancelled'
	| 'status_partial';

export type DocumentFolder = DocumentMailboxFolder | DocumentStatusFolder;

export type DocumentResource = 'invoice' | 'quote' | 'payable_debt';

export const DOCUMENT_MAILBOX_FOLDERS: DocumentMailboxFolder[] = [
	'inbox',
	'nouveau',
	'suivi',
	'attente',
	'important',
	'envoyes',
	'brouillons',
];

export const DOCUMENT_STATUS_FOLDERS: DocumentStatusFolder[] = [
	'status_draft',
	'status_sent',
	'status_viewed',
	'status_clicked',
	'status_accepted',
	'status_rejected',
	'status_expired',
	'status_overdue',
	'status_paid',
	'status_cancelled',
	'status_partial',
];

export const DOCUMENT_FOLDERS: DocumentFolder[] = [
	...DOCUMENT_MAILBOX_FOLDERS,
	...DOCUMENT_STATUS_FOLDERS,
];

export type DocumentFolderCounts = Record<DocumentFolder, number> & { archives: number };

function emailEventSome(type: 'sent' | 'opened' | 'clicked') {
	return { emailEvents: { some: { type } } };
}

function emailEventNone(type: 'opened' | 'clicked') {
	return { emailEvents: { none: { type } } };
}

function buildQuoteStatusFolderWhere(folder: DocumentStatusFolder): Record<string, unknown> {
	switch (folder) {
		case 'status_draft':
			return { status: 'DRAFT' };
		case 'status_accepted':
			return { status: 'ACCEPTED' };
		case 'status_rejected':
			return { status: 'REJECTED' };
		case 'status_expired':
			return { status: 'EXPIRED' };
		case 'status_clicked':
			return { status: 'SENT', ...emailEventSome('clicked') };
		case 'status_viewed':
			return { status: 'SENT', ...emailEventSome('opened'), ...emailEventNone('clicked') };
		case 'status_sent':
			return {
				status: 'SENT',
				...emailEventNone('opened'),
				...emailEventNone('clicked'),
			};
		default:
			return {};
	}
}

function buildInvoiceStatusFolderWhere(folder: DocumentStatusFolder): Record<string, unknown> {
	switch (folder) {
		case 'status_draft':
			return { status: 'DRAFT' };
		case 'status_overdue':
			return { status: 'OVERDUE' };
		case 'status_paid':
			return { status: 'PAID' };
		case 'status_cancelled':
			return { status: 'CANCELLED' };
		case 'status_clicked':
			return {
				status: { in: ['SENT', 'OVERDUE'] },
				...emailEventSome('clicked'),
			};
		case 'status_viewed':
			return {
				status: { in: ['SENT', 'OVERDUE'] },
				...emailEventSome('opened'),
				...emailEventNone('clicked'),
			};
		case 'status_sent':
			return {
				status: { in: ['SENT', 'OVERDUE'] },
				...emailEventNone('opened'),
				...emailEventNone('clicked'),
			};
		default:
			return {};
	}
}

function buildPayableStatusFolderWhere(folder: DocumentStatusFolder): Record<string, unknown> {
	switch (folder) {
		case 'status_draft':
			return { sentAt: null, status: 'OPEN' };
		case 'status_paid':
			return { status: 'PAID' };
		case 'status_cancelled':
			return { status: 'CANCELLED' };
		case 'status_partial':
			return { status: 'PARTIAL', ...emailEventNone('clicked') };
		case 'status_clicked':
			return { status: { in: ['OPEN', 'PARTIAL'] }, ...emailEventSome('clicked') };
		case 'status_viewed':
			return {
				status: { in: ['OPEN', 'PARTIAL'] },
				...emailEventSome('opened'),
				...emailEventNone('clicked'),
			};
		case 'status_sent':
			return {
				status: { in: ['OPEN', 'PARTIAL'] },
				sentAt: { not: null },
				...emailEventNone('opened'),
				...emailEventNone('clicked'),
			};
		default:
			return {};
	}
}

export function parseTagsJson(raw: string | null | undefined): string[] {
	if (!raw?.trim()) return [];
	try {
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed)
			? parsed.filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
			: [];
	} catch {
		return [];
	}
}

export function serializeTagsJson(tags: string[]): string {
	const unique = [...new Set(tags.map((t) => t.trim()).filter(Boolean))];
	return JSON.stringify(unique);
}

export function buildDocumentFolderWhere(
	folder: DocumentFolder | undefined,
	now = new Date(),
	resource: DocumentResource = 'invoice',
): Record<string, unknown> {
	if (!folder || folder === 'inbox') {
		return {
			OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: now } }],
		};
	}
	if (folder.startsWith('status_')) {
		if (resource === 'quote') return buildQuoteStatusFolderWhere(folder as DocumentStatusFolder);
		if (resource === 'payable_debt') {
			return buildPayableStatusFolderWhere(folder as DocumentStatusFolder);
		}
		return buildInvoiceStatusFolderWhere(folder as DocumentStatusFolder);
	}
	switch (folder) {
		case 'nouveau':
			return { seenAt: null };
		case 'suivi':
			return { starred: true };
		case 'attente':
			return { snoozedUntil: { gt: now } };
		case 'important':
			return { important: true };
		case 'envoyes':
			if (resource === 'payable_debt') {
				return { sentAt: { not: null } };
			}
			if (resource === 'quote') {
				return {
					OR: [{ status: 'SENT' }, { sentAt: { not: null } }],
				};
			}
			return { status: { in: ['SENT', 'OVERDUE', 'PAID'] } };
		case 'brouillons':
			if (resource === 'payable_debt') {
				return { sentAt: null, status: 'OPEN' };
			}
			return { status: 'DRAFT' };
		default:
			return {};
	}
}

export function documentFolderOrderBy(resource: DocumentResource) {
	if (resource === 'payable_debt') {
		return [{ sentAt: 'desc' as const }, { createdAt: 'desc' as const }];
	}
	return [{ sentAt: 'desc' as const }, { createdAt: 'desc' as const }];
}

/** Compteurs dossiers (boîte + statuts + archives). */
export async function computeDocumentFolderCounts(
	countFn: (extra: Record<string, unknown>) => Promise<number>,
	resource: DocumentResource,
	archiveCountFn: () => Promise<number>,
	folders: DocumentFolder[] = DOCUMENT_FOLDERS,
): Promise<DocumentFolderCounts> {
	const now = new Date();
	const counts = await Promise.all(
		folders.map(async (folder) => ({
			folder,
			count: await countFn(buildDocumentFolderWhere(folder, now, resource)),
		})),
	);
	const archives = await archiveCountFn();
	const result = Object.fromEntries(counts.map((c) => [c.folder, c.count])) as Record<
		DocumentFolder,
		number
	>;
	return { ...result, archives };
}
