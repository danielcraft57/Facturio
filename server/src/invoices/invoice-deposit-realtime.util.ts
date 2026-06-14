import { randomBytes } from 'crypto';
import type { PrismaService } from '../prisma/prisma.service';
import type { RealtimeEventsService } from '../realtime/realtime-events.service';
import { parseTagsJson, serializeTagsJson } from '../common/document-folder.util';
import { parseQuoteIdFromSplitTags } from './invoice-deposit.util';

/**
 * Après paiement de l'acompte, prépare la facture ECH liée (lien public, levée du blocage).
 */
export async function notifyLinkedRemainderAfterDepositPaid(
	prisma: PrismaService,
	realtime: RealtimeEventsService,
	depositInvoice: {
		id: string;
		tags: string | null;
		sourceQuoteId: string | null;
		organizationId: number | null;
	},
): Promise<void> {
	const orgId = depositInvoice.organizationId;
	if (!orgId) return;

	const tags = parseTagsJson(depositInvoice.tags);
	if (!tags.includes('ACOMPTE_10')) return;

	const quoteId = parseQuoteIdFromSplitTags(tags) ?? depositInvoice.sourceQuoteId;
	if (!quoteId) return;

	const linkedTags = [
		`SOLDE_APRES_ACOMPTE_OF:${quoteId}`,
		`ECHEANCIER_OF:${quoteId}`,
	];
	for (const tag of linkedTags) {
		const linked = await prisma.invoice.findFirst({
			where: { organizationId: orgId, tags: { contains: tag } },
			select: { id: true, number: true, status: true, tags: true, publicToken: true },
		});
		if (!linked || linked.id === depositInvoice.id) continue;

		const linkedTagList = parseTagsJson(linked.tags);
		const isEcheancier = linkedTagList.includes('ECHEANCIER');
		const nextTags = linkedTagList.filter((t) => t !== 'PENDING_EMIT');
		const token = linked.publicToken ?? randomBytes(32).toString('hex');

		if (isEcheancier && (nextTags.length !== linkedTagList.length || !linked.publicToken)) {
			await prisma.invoice.update({
				where: { id: linked.id },
				data: {
					publicToken: token,
					tags: serializeTagsJson(nextTags),
				},
			});
		}

		realtime.emit(orgId, 'invoices', 'updated', linked.id, {
			number: linked.number,
			status: linked.status,
		});
	}
}
