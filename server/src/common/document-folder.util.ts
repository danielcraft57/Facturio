/** Dossiers de classement pour documents émis (factures / devis). */
export type DocumentFolder =
	| 'inbox'
	| 'nouveau'
	| 'suivi'
	| 'attente'
	| 'important'
	| 'envoyes'
	| 'brouillons';

export type DocumentResource = 'invoice' | 'quote' | 'payable_debt';

export const DOCUMENT_FOLDERS: DocumentFolder[] = [
	'inbox',
	'nouveau',
	'suivi',
	'attente',
	'important',
	'envoyes',
	'brouillons',
];

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
