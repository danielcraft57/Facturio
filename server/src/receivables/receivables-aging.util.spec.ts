import {
	daysPastDue,
	receivableAgingBucket,
	addToAgingTotals,
	EMPTY_AGING_TOTALS,
} from './receivables-aging.util';

describe('receivables-aging.util', () => {
	const asOf = new Date('2026-06-15T12:00:00Z');

	it('daysPastDue — 0 si échéance future', () => {
		expect(daysPastDue(new Date('2026-07-01'), asOf)).toBe(0);
	});

	it('daysPastDue — retard depuis échéance passée', () => {
		expect(daysPastDue(new Date('2026-06-01'), asOf)).toBe(14);
	});

	it('receivableAgingBucket — à échoir', () => {
		expect(receivableAgingBucket(new Date('2026-07-01'), asOf)).toBe('not_due');
	});

	it('receivableAgingBucket — tranches de retard', () => {
		expect(receivableAgingBucket(new Date('2026-06-01'), asOf)).toBe('days_0_30');
		expect(receivableAgingBucket(new Date('2026-05-01'), asOf)).toBe('days_31_60');
		expect(receivableAgingBucket(new Date('2026-04-01'), asOf)).toBe('days_61_90');
		expect(receivableAgingBucket(new Date('2025-01-01'), asOf)).toBe('days_90_plus');
	});

	it('addToAgingTotals — cumul arrondi', () => {
		const totals = { ...EMPTY_AGING_TOTALS };
		addToAgingTotals(totals, 'days_0_30', 100.5);
		addToAgingTotals(totals, 'days_0_30', 50.25);
		expect(totals.days_0_30).toBe(150.75);
	});
});
