/** Factures éligibles au module Créances (solde > 0, hors annulées). */
export function buildReceivableInvoiceWhere(
	organizationId: number,
	dateRange?: { start?: Date; end?: Date },
): Record<string, unknown> {
	const where: Record<string, unknown> = {
		organizationId,
		archivedAt: null,
		status: { not: 'CANCELLED' },
		OR: [
			{ status: { not: 'DRAFT' } },
			// Solde après acompte : créance dès l'acceptation, avant envoi de la facture de solde
			{ status: 'DRAFT', tags: { contains: 'SOLDE_APRES_ACOMPTE' } },
		],
	};

	if (dateRange?.start || dateRange?.end) {
		where.date = {
			...(dateRange.start ? { gte: dateRange.start } : {}),
			...(dateRange.end ? { lte: dateRange.end } : {}),
		};
	}

	return where;
}
