/** Contexte minimal pour décider d'une relance d'échéance. */
export interface InstallmentReminderCandidate {
	installmentId: number;
	dueDate: Date;
	daysUntilDue: number;
	daysOverdue: number;
}

/**
 * Calcule le décalage en jours entre aujourd'hui (minuit) et une date d'échéance.
 *
 * @param dueDate - Date d'échéance
 * @param now - Date de référence
 */
export function daysUntilInstallmentDue(dueDate: Date, now: Date = new Date()): number {
	const today = startOfDay(now);
	const due = startOfDay(dueDate);
	return Math.round((due.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}

function startOfDay(d: Date): Date {
	const x = new Date(d);
	x.setHours(0, 0, 0, 0);
	return x;
}

/**
 * Indique si une relance « avant échéance » doit partir (ex. J-3).
 *
 * @param daysUntilDue - Jours restants (négatif = retard)
 * @param remindDaysBefore - Fenêtre d'anticipation (défaut 3)
 */
export function shouldSendUpcomingInstallmentReminder(
	daysUntilDue: number,
	remindDaysBefore: number,
): boolean {
	return daysUntilDue >= 0 && daysUntilDue <= remindDaysBefore;
}

/**
 * Indique si une relance « en retard » doit partir.
 *
 * @param daysUntilDue - Jours restants
 * @param overdueIntervalDays - Espacement entre relances retard (défaut 7)
 */
export function shouldSendOverdueInstallmentReminder(
	daysUntilDue: number,
	overdueIntervalDays: number,
): boolean {
	return daysUntilDue < 0 && Math.abs(daysUntilDue) % overdueIntervalDays === 0;
}

/**
 * Type de relance applicable aujourd'hui, ou null si aucune.
 */
export function resolveInstallmentReminderKind(
	daysUntilDue: number,
	options: { remindDaysBefore: number; overdueIntervalDays: number },
): 'upcoming' | 'overdue' | null {
	if (shouldSendUpcomingInstallmentReminder(daysUntilDue, options.remindDaysBefore)) {
		return 'upcoming';
	}
	if (shouldSendOverdueInstallmentReminder(daysUntilDue, options.overdueIntervalDays)) {
		return 'overdue';
	}
	return null;
}
