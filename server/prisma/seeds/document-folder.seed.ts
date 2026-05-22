/** Champs de classement (dossiers) pour les seeds factures / devis. */
export type DocumentFolderSeedFields = {
	starred?: boolean;
	important?: boolean;
	seenAt?: Date | null;
	snoozedUntil?: Date | null;
	tags?: string[];
	sentAt?: Date | null;
	archivedAt?: Date | null;
};

export function serializeTagsJson(tags: string[]): string {
	return JSON.stringify([...new Set(tags.map((t) => t.trim()).filter(Boolean))]);
}

export function daysFromNow(days: number): Date {
	const d = new Date();
	d.setDate(d.getDate() + days);
	d.setHours(12, 0, 0, 0);
	return d;
}

export function documentFolderFields(fields: DocumentFolderSeedFields): Record<string, unknown> {
	const data: Record<string, unknown> = {};
	if (fields.starred !== undefined) data.starred = fields.starred;
	if (fields.important !== undefined) data.important = fields.important;
	if (fields.seenAt !== undefined) data.seenAt = fields.seenAt;
	if (fields.snoozedUntil !== undefined) data.snoozedUntil = fields.snoozedUntil;
	if (fields.sentAt !== undefined) data.sentAt = fields.sentAt;
	if (fields.archivedAt !== undefined) data.archivedAt = fields.archivedAt;
	if (fields.tags !== undefined) data.tags = serializeTagsJson(fields.tags);
	return data;
}
