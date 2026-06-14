import { parseTagsJson } from '../common/document-folder.util';
import type { EngagementBreakdown } from './invoice-deposit.util';
import { parseQuoteIdFromSplitTags } from './invoice-deposit.util';

type PrismaLike = {
	invoice: {
		findFirst: (args: {
			where: Record<string, unknown>;
			select: { total: true };
			orderBy?: { createdAt: 'desc' | 'asc' };
		}) => Promise<{ total: unknown } | null>;
	};
	quote: {
		findUnique: (args: {
			where: { id: string };
			select: { total: true };
		}) => Promise<{ total: unknown } | null>;
	};
};

function toAmount(value: unknown): number {
	return Number((value as { toNumber?: () => number })?.toNumber?.() ?? value ?? 0);
}

/**
 * Retrouve total contrat / acompte / solde pour une facture split liée à un devis.
 * Retombe sur le total du devis si la facture de solde n'est pas encore retrouvable en base.
 */
export async function resolveEngagementBreakdownForInvoice(
	prisma: PrismaLike,
	invoice: {
		id: string;
		sourceQuoteId: string | null;
		organizationId: number | null;
		tags: string | null;
		total?: unknown;
	},
): Promise<EngagementBreakdown | null> {
	const tags = parseTagsJson(invoice.tags);
	const isSplit =
		tags.includes('ACOMPTE_10') ||
		tags.includes('SOLDE_APRES_ACOMPTE') ||
		tags.includes('ECHEANCIER') ||
		tags.some(
			(t) =>
				t.startsWith('ACOMPTE_10_OF:') ||
				t.startsWith('SOLDE_APRES_ACOMPTE_OF:') ||
				t.startsWith('ECHEANCIER_OF:'),
		);
	if (!isSplit) return null;

	const orgId = invoice.organizationId;
	if (!orgId) return null;

	const quoteId = invoice.sourceQuoteId ?? parseQuoteIdFromSplitTags(tags);
	if (!quoteId) {
		if (tags.includes('ACOMPTE_10') && invoice.total != null) {
			const depositAmount = toAmount(invoice.total);
			return depositAmount > 0
				? {
						contractTotal: Number((depositAmount * 10).toFixed(2)),
						depositAmount: Number(depositAmount.toFixed(2)),
						remainderAmount: Number((depositAmount * 9).toFixed(2)),
					}
				: null;
		}
		return null;
	}

	const depositTag = `ACOMPTE_10_OF:${quoteId}`;
	const remainderTag = `SOLDE_APRES_ACOMPTE_OF:${quoteId}`;
	const installmentTag = `ECHEANCIER_OF:${quoteId}`;

	const [depositRow, remainderRow, installmentRow, quoteRow] = await Promise.all([
		prisma.invoice.findFirst({
			where: {
				organizationId: orgId,
				OR: [
					{ tags: { contains: `"${depositTag}"` } },
					{ sourceQuoteId: quoteId, tags: { contains: '"ACOMPTE_10"' } },
				],
			},
			select: { total: true },
			orderBy: { createdAt: 'desc' },
		}),
		prisma.invoice.findFirst({
			where: {
				organizationId: orgId,
				OR: [
					{ tags: { contains: `"${remainderTag}"` } },
					{ sourceQuoteId: quoteId, tags: { contains: '"SOLDE_APRES_ACOMPTE"' } },
				],
			},
			select: { total: true },
			orderBy: { createdAt: 'desc' },
		}),
		prisma.invoice.findFirst({
			where: {
				organizationId: orgId,
				tags: { contains: `"${installmentTag}"` },
			},
			select: { total: true },
			orderBy: { createdAt: 'desc' },
		}),
		prisma.quote.findUnique({
			where: { id: quoteId },
			select: { total: true },
		}),
	]);

	let depositAmount = depositRow ? toAmount(depositRow.total) : 0;
	let remainderAmount = remainderRow
		? toAmount(remainderRow.total)
		: installmentRow
			? toAmount(installmentRow.total)
			: 0;

	if (depositAmount <= 0 && tags.includes('ACOMPTE_10')) {
		depositAmount = toAmount(invoice.total);
	}
	if (remainderAmount <= 0 && tags.includes('SOLDE_APRES_ACOMPTE')) {
		remainderAmount = toAmount(invoice.total);
	}

	const quoteTotal = quoteRow ? toAmount(quoteRow.total) : 0;

	if (quoteTotal > 0) {
		if (depositAmount <= 0 && remainderAmount > 0) {
			depositAmount = Math.max(0, Number((quoteTotal - remainderAmount).toFixed(2)));
		}
		if (remainderAmount <= 0 && depositAmount > 0) {
			remainderAmount = Math.max(0, Number((quoteTotal - depositAmount).toFixed(2)));
		}
	}

	const contractTotal =
		quoteTotal > 0
			? quoteTotal
			: Number((depositAmount + remainderAmount).toFixed(2));

	if (contractTotal <= 0) return null;

	if (remainderAmount <= 0 && depositAmount > 0 && contractTotal > depositAmount) {
		remainderAmount = Number((contractTotal - depositAmount).toFixed(2));
	}
	if (depositAmount <= 0 && remainderAmount > 0 && contractTotal > remainderAmount) {
		depositAmount = Number((contractTotal - remainderAmount).toFixed(2));
	}

	return {
		contractTotal: Number(contractTotal.toFixed(2)),
		depositAmount: Number(depositAmount.toFixed(2)),
		remainderAmount: Number(remainderAmount.toFixed(2)),
	};
}
