import {
	addCalendarDays,
	computeInvoiceDueDate,
	DEFAULT_DEPOSIT_DUE_POLICY,
	DEFAULT_REMAINDER_DUE_POLICY,
} from './invoice-due-date.util';

describe('invoice-due-date.util', () => {
	const base = new Date('2026-06-01T10:00:00.000Z');

	it('acompte : échéance à l’acceptation', () => {
		const due = computeInvoiceDueDate(DEFAULT_DEPOSIT_DUE_POLICY, { baseDate: base });
		expect(due.getDate()).toBe(base.getDate());
	});

	it('solde : J+30', () => {
		const due = computeInvoiceDueDate(DEFAULT_REMAINDER_DUE_POLICY, { baseDate: base });
		expect(due.getTime()).toBeGreaterThan(base.getTime());
		expect(addCalendarDays(base, 30).getDate()).toBe(due.getDate());
	});

	it('quote_expiry utilise la date du devis', () => {
		const expiry = new Date('2026-08-15');
		const due = computeInvoiceDueDate('quote_expiry', { baseDate: base, quoteExpiry: expiry });
		expect(due.toISOString()).toBe(expiry.toISOString());
	});
});
