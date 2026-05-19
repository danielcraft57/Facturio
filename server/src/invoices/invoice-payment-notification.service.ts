import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '../common/email.service';
import { buildPublicInvoiceUrl } from '../common/public-app-url';
import { ConfigService } from '../config/config.service';
import { PrismaService } from '../prisma/prisma.service';

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

@Injectable()
export class InvoicePaymentNotificationService {
	private readonly logger = new Logger(InvoicePaymentNotificationService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly email: EmailService,
		private readonly config: ConfigService,
	) {}

	/**
	 * Envoie les emails client + prestataire lorsque la facture vient d’être intégralement soldée.
	 */
	async notifyInvoiceFullyPaid(
		invoiceId: number,
		options: { lastPaymentAmount: number; paymentMethod?: string | null },
	): Promise<void> {
		const existing = await this.prisma.emailEvent.findFirst({
			where: { invoiceId, type: PAID_NOTIFICATION_EVENT },
		});
		if (existing) return;

		const invoice = await this.prisma.invoice.findUnique({
			where: { id: invoiceId },
			include: {
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
