/**
 * Normalise un taux de TVA API : décimal (0.2 = 20 %) ou pourcentage (20 → 0.2).
 */
export function normalizeTaxRateDecimal(rate: number | undefined | null): number | undefined {
	if (rate == null || Number.isNaN(Number(rate))) return undefined;
	const n = Number(rate);
	if (n > 1) return n / 100;
	return n;
}
