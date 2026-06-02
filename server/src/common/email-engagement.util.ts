import type { PrismaService } from '../prisma/prisma.service';
import { CLICK_ACTION_LABELS } from './email-track.util';

export type EmailEngagementSummary = {
	emailSent: boolean;
	sentAt: string | null;
	opened: boolean;
	openedAt: string | null;
	clicked: boolean;
	clickedAt: string | null;
	clickAction: string | null;
	clickLabel: string | null;
};

type EmailEventRow = {
	type: string;
	meta: unknown;
	createdAt: Date;
};

function parseClickAction(meta: unknown): string | null {
	if (!meta || typeof meta !== 'object') return null;
	const action = (meta as { action?: unknown }).action;
	return typeof action === 'string' && action.trim() ? action.trim() : null;
}

export function summarizeEmailEvents(
	events: EmailEventRow[],
): EmailEngagementSummary {
	const sentEvent = events.find((e) => e.type === 'sent');
	const openedEvent = events.find((e) => e.type === 'opened');
	const clickedEvent = events.find((e) => e.type === 'clicked');
	const clickAction = clickedEvent ? parseClickAction(clickedEvent.meta) : null;

	const emailSentAt = sentEvent?.createdAt ?? null;

	return {
		emailSent: Boolean(sentEvent),
		sentAt: emailSentAt ? emailSentAt.toISOString() : null,
		opened: Boolean(openedEvent),
		openedAt: openedEvent ? openedEvent.createdAt.toISOString() : null,
		clicked: Boolean(clickedEvent),
		clickedAt: clickedEvent ? clickedEvent.createdAt.toISOString() : null,
		clickAction,
		clickLabel: clickAction ? (CLICK_ACTION_LABELS[clickAction] ?? clickAction) : null,
	};
}

export async function getInvoiceEmailEngagement(
	prisma: PrismaService,
	invoiceId: string,
): Promise<EmailEngagementSummary> {
	const events = await prisma.emailEvent.findMany({
		where: {
			invoiceId,
			type: { in: ['sent', 'opened', 'clicked'] },
		},
		orderBy: { createdAt: 'asc' },
		select: { type: true, meta: true, createdAt: true },
	});
	return summarizeEmailEvents(events);
}

export async function getQuoteEmailEngagement(
	prisma: PrismaService,
	quoteId: string,
): Promise<EmailEngagementSummary> {
	const events = await prisma.emailEvent.findMany({
		where: {
			quoteId,
			type: { in: ['sent', 'opened', 'clicked'] },
		},
		orderBy: { createdAt: 'asc' },
		select: { type: true, meta: true, createdAt: true },
	});
	return summarizeEmailEvents(events);
}

/** Enregistre l’envoi effectif d’un email document (après succès SMTP). */
export async function recordQuoteEmailSent(prisma: PrismaService, quoteId: string) {
	await prisma.emailEvent.create({ data: { quoteId, type: 'sent' } });
}

export async function recordInvoiceEmailSent(prisma: PrismaService, invoiceId: string) {
	await prisma.emailEvent.create({ data: { invoiceId, type: 'sent' } });
}

export type ListEmailEngagementFlags = {
	emailSent: boolean;
	emailOpened: boolean;
	emailClicked: boolean;
	emailClickAction: string | null;
};

export async function attachListEmailEngagementFlags<T extends { id: string }>(
	prisma: PrismaService,
	items: T[],
	kind: 'invoice' | 'quote',
): Promise<(T & ListEmailEngagementFlags)[]> {
	if (!items.length) return [];
	const ids = items.map((i) => i.id);
	const events = await prisma.emailEvent.findMany({
		where: {
			type: { in: ['sent', 'opened', 'clicked'] },
			...(kind === 'invoice' ? { invoiceId: { in: ids } } : { quoteId: { in: ids } }),
		},
		select: { invoiceId: true, quoteId: true, type: true, meta: true, createdAt: true },
		orderBy: { createdAt: 'asc' },
	});
	const sentIds = new Set<string>();
	const openedIds = new Set<string>();
	const clickedIds = new Set<string>();
	const lastClickAction = new Map<string, string>();
	for (const e of events) {
		const docId = (kind === 'invoice' ? e.invoiceId : e.quoteId) as string | null;
		if (!docId) continue;
		if (e.type === 'sent') sentIds.add(docId);
		if (e.type === 'opened') openedIds.add(docId);
		if (e.type === 'clicked') {
			clickedIds.add(docId);
			const action = parseClickAction(e.meta);
			if (action) lastClickAction.set(docId, action);
		}
	}
	return items.map((item) => ({
		...item,
		emailSent: sentIds.has(item.id),
		emailOpened: openedIds.has(item.id),
		emailClicked: clickedIds.has(item.id),
		emailClickAction: lastClickAction.get(item.id) ?? null,
	}));
}

/** @deprecated Utiliser attachListEmailEngagementFlags */
export const attachEmailSentFlags = attachListEmailEngagementFlags;
