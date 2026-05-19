import type { Organization } from '@prisma/client';
import { buildPlatformIssuerOrganization } from '../common/pdf/pdf-signature.util';

export interface SubscriptionInvoicePdfPayload {
	number: string;
	date: Date;
	client: Record<string, unknown>;
	lines: { description: string; quantity: number; unitPrice: number; total?: number }[];
	totals: { subtotal: number; tax: number; total: number };
	organization: Record<string, unknown>;
	document: { paymentNote: string };
}

function formatOrgAddress(org: Organization): string {
	const parts = [
		org.address,
		org.address2,
		[org.zipCode, org.city].filter(Boolean).join(' '),
		org.country && org.country !== 'FR' ? org.country : '',
	].filter(Boolean);
	return parts.join(', ');
}

function mapStripeLines(invoice: Record<string, unknown>): SubscriptionInvoicePdfPayload['lines'] {
	const linesContainer = invoice.lines as { data?: Record<string, unknown>[] } | undefined;
	const items = linesContainer?.data ?? [];
	if (!items.length) {
		const total = Number(invoice.amount_paid ?? invoice.total ?? 0) / 100;
		return [
			{
				description: 'Abonnement Facturio',
				quantity: 1,
				unitPrice: total,
				total,
			},
		];
	}
	return items.map((line) => {
		const qty = Number(line.quantity ?? 1) || 1;
		const amountCents = Number(line.amount ?? 0);
		const unit = amountCents / 100 / qty;
		return {
			description: String(line.description ?? 'Abonnement Facturio'),
			quantity: qty,
			unitPrice: unit,
			total: amountCents / 100,
		};
	});
}

export function buildSubscriptionInvoicePdfPayload(
	stripeInvoice: Record<string, unknown>,
	customerOrg: Organization,
	recipientEmail?: string,
): SubscriptionInvoicePdfPayload {
	const created =
		typeof stripeInvoice.created === 'number'
			? new Date(stripeInvoice.created * 1000)
			: new Date();
	const statusTransitions = stripeInvoice.status_transitions as
		| { paid_at?: number }
		| undefined;
	const paidAt =
		typeof statusTransitions?.paid_at === 'number'
			? new Date(statusTransitions.paid_at * 1000)
			: created;

	const subtotal = Number(stripeInvoice.subtotal ?? stripeInvoice.amount_paid ?? 0) / 100;
	const tax = Number(stripeInvoice.tax ?? 0) / 100;
	const total = Number(stripeInvoice.total ?? stripeInvoice.amount_paid ?? 0) / 100;

	const clientName =
		customerOrg.legalName?.trim() || customerOrg.name?.trim() || 'Client';

	return {
		number: String(stripeInvoice.number ?? stripeInvoice.id ?? 'FACTURIO'),
		date: paidAt,
		client: {
			name: clientName,
			companyName: customerOrg.legalName ?? customerOrg.name,
			address: formatOrgAddress(customerOrg),
			email: recipientEmail ?? customerOrg.email ?? '',
			phone: customerOrg.phone ?? '',
			isCompany: true,
			siret: customerOrg.siret ?? '',
			vatNumber: customerOrg.vatNumber ?? '',
		},
		lines: mapStripeLines(stripeInvoice),
		totals: { subtotal, tax, total },
		organization: buildPlatformIssuerOrganization(),
		document: {
			paymentNote: 'Paiement effectué par carte bancaire (Stripe).',
		},
	};
}
