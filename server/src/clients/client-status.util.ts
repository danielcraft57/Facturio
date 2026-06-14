import type { ClientStatus, PrismaClient } from '@prisma/client';

/** Signaux métier pour déduire le statut client affiché en liste. */
export type ClientStatusSignals = {
	storedStatus: ClientStatus;
	archived: boolean;
	paidInvoiceCount: number;
	quoteCount: number;
};

/**
 * Dérive le statut effectif d'un client :
 * - au moins une facture payée → actif ;
 * - sinon (devis seulement ou rien) → prospect ;
 * - inactif / archivé conservé tel quel.
 */
export function deriveClientStatus(signals: ClientStatusSignals): ClientStatus {
	if (signals.archived || signals.storedStatus === 'INACTIVE') {
		return 'INACTIVE';
	}
	if (signals.paidInvoiceCount > 0) {
		return 'ACTIVE';
	}
	return 'PROSPECT';
}

/**
 * Recalcule et persiste le statut client à partir des factures payées et devis.
 *
 * @param prisma - Client Prisma
 * @param clientId - Identifiant client
 * @returns Statut effectif après synchronisation
 */
export async function syncClientStatusFromActivity(
	prisma: PrismaClient,
	clientId: string,
): Promise<ClientStatus> {
	const client = await prisma.client.findUnique({
		where: { id: clientId },
		select: { id: true, status: true, archivedAt: true },
	});
	if (!client) {
		return 'PROSPECT';
	}

	const [paidInvoiceCount, quoteCount] = await Promise.all([
		prisma.invoice.count({
			where: { clientId, status: 'PAID' },
		}),
		prisma.quote.count({
			where: { clientId, archivedAt: null },
		}),
	]);

	const nextStatus = deriveClientStatus({
		storedStatus: client.status,
		archived: client.archivedAt != null,
		paidInvoiceCount,
		quoteCount,
	});

	if (nextStatus !== client.status) {
		await prisma.client.update({
			where: { id: clientId },
			data: { status: nextStatus },
		});
	}

	return nextStatus;
}
