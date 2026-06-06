/** Politique d'échéance pour factures / créances (France, usage B2B). */
export type InvoiceDueDatePolicy = 'on_acceptance' | 'days_7' | 'days_30' | 'quote_expiry';

/** Acompte : payable à l'acceptation (jour même). */
export const DEFAULT_DEPOSIT_DUE_POLICY: InvoiceDueDatePolicy = 'on_acceptance';

/** Solde et facture standard : 30 jours après l'événement de référence. */
export const DEFAULT_REMAINDER_DUE_POLICY: InvoiceDueDatePolicy = 'days_30';
export const DEFAULT_STANDARD_DUE_POLICY: InvoiceDueDatePolicy = 'days_30';

/** Jours minimum de retard avant relance automatique. */
export const RECEIVABLE_AUTO_REMIND_MIN_DAYS_PAST_DUE = 3;

/** Délai minimum entre deux relances sur la même facture. */
export const RECEIVABLE_REMIND_COOLDOWN_DAYS = 7;

export function addCalendarDays(base: Date, days: number): Date {
	const d = new Date(base);
	d.setDate(d.getDate() + days);
	d.setHours(23, 59, 59, 999);
	return d;
}

export function computeInvoiceDueDate(
	policy: InvoiceDueDatePolicy,
	opts: {
		baseDate?: Date;
		quoteExpiry?: Date | string | null;
	},
): Date {
	const base = opts.baseDate ? new Date(opts.baseDate) : new Date();
	switch (policy) {
		case 'on_acceptance':
			return addCalendarDays(base, 0);
		case 'days_7':
			return addCalendarDays(base, 7);
		case 'days_30':
			return addCalendarDays(base, 30);
		case 'quote_expiry': {
			if (opts.quoteExpiry) return new Date(opts.quoteExpiry);
			return addCalendarDays(base, 30);
		}
		default:
			return addCalendarDays(base, 30);
	}
}
