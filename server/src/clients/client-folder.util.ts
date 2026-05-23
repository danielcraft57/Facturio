import type { ClientStatus } from '@prisma/client';

export type ClientFolder =
	| 'inbox'
	| 'actifs'
	| 'inactifs'
	| 'prospects'
	| 'entreprises'
	| 'particuliers';

export const CLIENT_FOLDERS: ClientFolder[] = [
	'inbox',
	'actifs',
	'inactifs',
	'prospects',
	'entreprises',
	'particuliers',
];

export function isClientFolder(value: string | undefined): value is ClientFolder {
	return !!value && (CLIENT_FOLDERS as string[]).includes(value);
}

export function buildClientFolderWhere(
	folder: ClientFolder | undefined,
): Record<string, unknown> {
	if (!folder || folder === 'inbox') return {};
	switch (folder) {
		case 'actifs':
			return { status: 'ACTIVE' as ClientStatus };
		case 'inactifs':
			return { status: 'INACTIVE' as ClientStatus };
		case 'prospects':
			return { status: 'PROSPECT' as ClientStatus };
		case 'entreprises':
			return { isCompany: true };
		case 'particuliers':
			return { isCompany: false };
		default:
			return {};
	}
}
