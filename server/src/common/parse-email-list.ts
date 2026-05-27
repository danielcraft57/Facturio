const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

/** Parse une liste d’emails (virgule, point-virgule ou retour ligne). */
export function parseEmailList(raw?: string | string[] | null): string[] {
	if (!raw) return [];
	const parts = Array.isArray(raw) ? raw : String(raw).split(/[,;\n]+/);
	const seen = new Set<string>();
	const out: string[] = [];
	for (const part of parts) {
		const trimmed = part.trim();
		if (!trimmed || !EMAIL_RE.test(trimmed)) continue;
		const key = trimmed.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(trimmed);
	}
	return out;
}

/** Déduplique et exclut éventuellement l’email principal (destinataires additionnels). */
export function uniqueCopyRecipients(
	candidates: string[],
	excludePrimary?: string | null,
): string[] {
	const exclude = excludePrimary?.trim().toLowerCase();
	const seen = new Set<string>();
	const out: string[] = [];
	for (const email of candidates) {
		const trimmed = email.trim();
		if (!trimmed) continue;
		const key = trimmed.toLowerCase();
		if (exclude && key === exclude) continue;
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(trimmed);
	}
	return out;
}
