import type { ClientStatus } from '@prisma/client';

export type ClientFolder =
	| 'inbox'
	| 'actifs'
	| 'inactifs'
	| 'prospects'
	| 'entreprises'
	| 'particuliers'
	| 'archives';

export const CLIENT_FOLDERS: ClientFolder[] = [
	'inbox',
	'actifs',
	'inactifs',
	'prospects',
	'entreprises',
	'particuliers',
	'archives',
];

export function isClientFolder(value: string | undefined): value is ClientFolder {
	return !!value && (CLIENT_FOLDERS as string[]).includes(value);
}

export function buildClientFolderWhere(
	folder: ClientFolder | undefined,
): Record<string, unknown> {
	if (folder === 'archives') {
		return { archivedAt: { not: null } };
	}
	const activeOnly = { archivedAt: null };
	if (!folder || folder === 'inbox') return activeOnly;
	switch (folder) {
		case 'actifs':
			return { ...activeOnly, status: 'ACTIVE' as ClientStatus };
		case 'inactifs':
			return { ...activeOnly, status: 'INACTIVE' as ClientStatus };
		case 'prospects':
			return { ...activeOnly, status: 'PROSPECT' as ClientStatus };
		case 'entreprises':
			return { ...activeOnly, isCompany: true };
		case 'particuliers':
			return { ...activeOnly, isCompany: false };
		default:
			return activeOnly;
	}
}
