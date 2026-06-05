import type { PrismaService } from '../prisma/prisma.service';
import type { RealtimeEventsService } from '../realtime/realtime-events.service';
import { parseTagsJson } from '../common/document-folder.util';
import { parseQuoteIdFromSplitTags } from './invoice-deposit.util';

/** Après paiement de l'acompte, notifie la facture de solde liée (rafraîchissement listes / créances). */
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

	const remainderTag = `SOLDE_APRES_ACOMPTE_OF:${quoteId}`;
	const remainder = await prisma.invoice.findFirst({
		where: { organizationId: orgId, tags: { contains: remainderTag } },
		select: { id: true, number: true, status: true },
	});
	if (!remainder || remainder.id === depositInvoice.id) return;

	realtime.emit(orgId, 'invoices', 'updated', remainder.id, {
		number: remainder.number,
		status: remainder.status,
	});
}
