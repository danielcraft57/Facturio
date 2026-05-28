import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '../common/email.service';
import { PdfService } from '../common/pdf.service';
import { parseTagsJson } from '../common/document-folder.util';
import { buildPublicInvoiceUrl } from '../common/public-app-url';
import { ConfigService } from '../config/config.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { PrismaService } from '../prisma/prisma.service';
import { resolveEngagementBreakdownForInvoice } from './invoice-engagement-breakdown.util';
import type { InvoiceDocumentKind } from './invoice-deposit.util';

const PAID_NOTIFICATION_EVENT = 'invoice_paid_notified';

function formatPaymentMethodLabel(method?: string | null): string {
	if (!method) return 'Paiement en ligne';
	const m = method.toUpperCase();
	if (m === 'STRIPE') return 'Carte bancaire (Stripe)';
	if (m === 'CARD') return 'Carte bancaire';
	if (m === 'TRANSFER' || m === 'VIREMENT') return 'Virement';
	if (m === 'CHECK' || m === 'CHEQUE') return 'Chèque';
	if (m === 'CASH' || m === 'ESPECES') return 'Espèces';
	return method;
}

function resolveDocumentKind(tags: string[]): InvoiceDocumentKind {
	if (tags.includes('ACOMPTE_10')) return 'deposit';
	if (tags.includes('SOLDE_APRES_ACOMPTE')) return 'remainder';
	return 'standard';
}

@Injectable()
export class InvoicePaymentNotificationService {
	private readonly logger = new Logger(InvoicePaymentNotificationService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly email: EmailService,
		private readonly pdfService: PdfService,
		private readonly organizations: OrganizationsService,
		private readonly config: ConfigService,
	) {}

	/**
	 * Envoie les emails client + prestataire lorsque la facture vient d’être intégralement soldée.
	 */
	async notifyInvoiceFullyPaid(
		invoiceId: string,
		options: { lastPaymentAmount: number; paymentMethod?: string | null },
	): Promise<void> {
		const existing = await this.prisma.emailEvent.findFirst({
			where: { invoiceId, type: PAID_NOTIFICATION_EVENT },
		});
		if (existing) return;

		const invoice = await this.prisma.invoice.findUnique({
			where: { id: invoiceId },
			include: {
				lines: true,
				client: true,
				organization: {
					select: {
						id: true,
						name: true,
						legalName: true,
						email: true,
						dataControllerEmail: true,
					},
				},
			},
		});
		if (!invoice || invoice.status !== 'PAID') return;

		const client = invoice.client;
		const org = invoice.organization;
		const issuerName = org?.legalName || org?.name || 'Votre prestataire';
		const clientDisplay =
			client?.companyName?.trim() || client?.name?.trim() || 'Client';
		const total = Number(invoice.total);
		const methodLabel = formatPaymentMethodLabel(options.paymentMethod);
		const invoiceViewUrl = invoice.publicToken
			? buildPublicInvoiceUrl(invoice.publicToken)
			: undefined;
		const appInvoiceUrl = `${this.config.frontendUrl.replace(/\/$/, '')}/factures/${invoice.id}`;

		const tags = parseTagsJson(invoice.tags);
		const documentKind = resolveDocumentKind(tags);
		const engagementBreakdown = await resolveEngagementBreakdownForInvoice(this.prisma, invoice);
		const attachments = await this.buildPaidEmailAttachments(invoice, documentKind);

		let sentAny = false;

		if (client?.email?.trim()) {
			try {
				await this.email.sendInvoicePaidToClient({
					to: client.email.trim(),
					clientName: clientDisplay,
					invoiceNumber: invoice.number,
					invoiceDate: invoice.date,
					total,
					lastPaymentAmount: options.lastPaymentAmount,
					paymentMethodLabel: methodLabel,
					issuerName,
					invoiceViewUrl,
					replyTo: org?.dataControllerEmail || org?.email || undefined,
					attachments,
					paidContext: {
						kind: documentKind,
						contractTotal: engagementBreakdown?.contractTotal,
						remainderAmount: engagementBreakdown?.remainderAmount,
					},
				});
				sentAny = true;
			} catch (err) {
				this.logger.warn(
					`Email client (facture payée ${invoice.number}): ${(err as Error).message}`,
				);
			}
		}

		const providerEmail =
			invoice.organizationId != null
				? await this.resolveProviderEmail(invoice.organizationId, org)
				: null;
		if (providerEmail) {
			try {
				await this.email.sendInvoicePaidToProvider({
					to: providerEmail,
					issuerName,
					clientName: clientDisplay,
					invoiceNumber: invoice.number,
					total,
					lastPaymentAmount: options.lastPaymentAmount,
					paymentMethodLabel: methodLabel,
					appInvoiceUrl,
				});
				sentAny = true;
			} catch (err) {
				this.logger.warn(
					`Email prestataire (facture payée ${invoice.number}): ${(err as Error).message}`,
				);
			}
		}

		if (sentAny) {
			await this.prisma.emailEvent.create({
				data: { invoiceId, type: PAID_NOTIFICATION_EVENT },
			});
		}
	}

	private async buildPaidEmailAttachments(
		invoice: {
			id: string;
			number: string;
			organizationId: number | null;
			tags: string | null;
			sourceQuoteId: string | null;
			total: unknown;
			lines: unknown[];
			client: unknown;
		},
		documentKind: InvoiceDocumentKind,
	): Promise<{ filename: string; content: Buffer; contentType?: string }[]> {
		const attachments: { filename: string; content: Buffer; contentType?: string }[] = [];
		if (!invoice.organizationId) return attachments;

		let organization: unknown;
		try {
			organization = await this.organizations.getProfile(invoice.organizationId);
		} catch {
			organization = undefined;
		}

		try {
			const pdf = await this.pdfService.generateInvoicePdf(invoice, organization);
			attachments.push({
				filename: `facture-${invoice.number}.pdf`,
				content: pdf,
				contentType: 'application/pdf',
			});
		} catch (err) {
			this.logger.warn(
				`PDF facture (confirmation paiement ${invoice.number}): ${(err as Error).message}`,
			);
		}

		if (documentKind === 'deposit') {
			try {
				const contractPdf = await this.pdfService.generateEngagementContractPdf(invoice, organization);
				attachments.push({
					filename: `contrat-prestation-${invoice.number}.pdf`,
					content: contractPdf,
					contentType: 'application/pdf',
				});
			} catch (err) {
				this.logger.warn(
					`PDF contrat (confirmation paiement ${invoice.number}): ${(err as Error).message}`,
				);
			}
		}

		return attachments;
	}

	private async resolveProviderEmail(
		organizationId: number,
		org: { email?: string | null } | null,
	): Promise<string | null> {
		if (org?.email?.trim()) return org.email.trim();
		const admin = await this.prisma.user.findFirst({
			where: { organizationId, role: 'ADMIN', status: 'ACTIVE' },
			orderBy: { id: 'asc' },
			select: { email: true },
		});
		return admin?.email?.trim() ?? null;
	}
}
