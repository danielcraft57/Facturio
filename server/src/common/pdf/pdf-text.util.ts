/**
 * Nettoie une description de ligne lorsqu'elle contient deux fois le même libellé
 * (ex. sélection produit Autocomplete + saisie libre).
 */
export function dedupeRepeatedDescription(text: string): string {
	const trimmed = text.trim();
	if (!trimmed) return trimmed;
	const match = trimmed.match(/^(.+?)\s+\1$/u);
	return match ? match[1].trim() : trimmed;
}
