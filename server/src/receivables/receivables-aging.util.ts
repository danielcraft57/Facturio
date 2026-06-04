export type ReceivableAgingBucket =
	| 'not_due'
	| 'days_0_30'
	| 'days_31_60'
	| 'days_61_90'
	| 'days_90_plus';

export type ReceivableAgingTotals = Record<ReceivableAgingBucket, number>;

export const EMPTY_AGING_TOTALS: ReceivableAgingTotals = {
	not_due: 0,
	days_0_30: 0,
	days_31_60: 0,
	days_61_90: 0,
	days_90_plus: 0,
};

/** Jours de retard après la date d'échéance (ou date facture si pas d'échéance). */
export function daysPastDue(referenceDate: Date, asOf: Date = new Date()): number {
	const ref = startOfUtcDay(referenceDate);
	const today = startOfUtcDay(asOf);
	const diffMs = today.getTime() - ref.getTime();
	return Math.max(0, Math.floor(diffMs / 86_400_000));
}

export function receivableAgingBucket(referenceDate: Date, asOf: Date = new Date()): ReceivableAgingBucket {
	const ref = startOfUtcDay(referenceDate);
	const today = startOfUtcDay(asOf);
	if (today.getTime() < ref.getTime()) return 'not_due';
	const overdue = daysPastDue(referenceDate, asOf);
	if (overdue <= 30) return 'days_0_30';
	if (overdue <= 60) return 'days_31_60';
	if (overdue <= 90) return 'days_61_90';
	return 'days_90_plus';
}

export function addToAgingTotals(totals: ReceivableAgingTotals, bucket: ReceivableAgingBucket, amount: number): void {
	totals[bucket] = Number((totals[bucket] + amount).toFixed(2));
}

function startOfUtcDay(d: Date): Date {
	return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
