import {
	daysUntilInstallmentDue,
	resolveInstallmentReminderKind,
	shouldSendOverdueInstallmentReminder,
	shouldSendUpcomingInstallmentReminder,
} from './invoice-installment-reminder.util';

describe('invoice-installment-reminder.util', () => {
	const ref = new Date('2026-06-11T12:00:00Z');

	it('calcule les jours jusqu’à l’échéance', () => {
		expect(daysUntilInstallmentDue(new Date('2026-06-14'), ref)).toBe(3);
		expect(daysUntilInstallmentDue(new Date('2026-06-10'), ref)).toBe(-1);
	});

	it('relance anticipée J-3 à J-0', () => {
		expect(shouldSendUpcomingInstallmentReminder(3, 3)).toBe(true);
		expect(shouldSendUpcomingInstallmentReminder(0, 3)).toBe(true);
		expect(shouldSendUpcomingInstallmentReminder(4, 3)).toBe(false);
	});

	it('relance retard tous les 7 jours', () => {
		expect(shouldSendOverdueInstallmentReminder(-7, 7)).toBe(true);
		expect(shouldSendOverdueInstallmentReminder(-3, 7)).toBe(false);
	});

	it('resolveInstallmentReminderKind', () => {
		expect(
			resolveInstallmentReminderKind(2, { remindDaysBefore: 3, overdueIntervalDays: 7 }),
		).toBe('upcoming');
		expect(
			resolveInstallmentReminderKind(-14, { remindDaysBefore: 3, overdueIntervalDays: 7 }),
		).toBe('overdue');
		expect(
			resolveInstallmentReminderKind(10, { remindDaysBefore: 3, overdueIntervalDays: 7 }),
		).toBeNull();
	});
});
