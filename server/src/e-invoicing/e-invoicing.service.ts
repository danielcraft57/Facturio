import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EInvoiceStatus } from '@prisma/client';
import { BillingService } from '../billing/billing.service';
import { PrismaService } from '../prisma/prisma.service';
import { EInvoicingComplianceService } from './e-invoicing-compliance.service';
import { FacturXGeneratorService } from './factur-x-generator.service';
import { PaPartnerClient } from './pa-partner.client';

@Injectable()
export class EInvoicingService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly compliance: EInvoicingComplianceService,
		private readonly facturX: FacturXGeneratorService,
		private readonly billing: BillingService,
		private readonly paPartner: PaPartnerClient,
	) {}

	async getOrganizationReadiness(organizationId: number) {
		const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
		if (!org) throw new NotFoundException('Organisation introuvable');

		const plan = await this.billing.getOrganizationPlan(organizationId);
		const planAllows = this.billing.hasFeature(plan, 'eInvoicing');

		const base = this.compliance.evaluateOrganization(org);
		return {
			...base,
			planAllowsEInvoicing: planAllows,
			paConnected: this.paPartner.getStatus().configured,
			reformDates: {
				reception: '2026-09-01',
				emissionEti: '2026-09-01',
				emissionPme: '2027-09-01',
			},
			nextSteps: planAllows
				? ['Compléter le profil émetteur', 'Renseigner le SIREN de vos clients B2B', 'Générer Factur-X avant envoi PA (module PA à venir)']
				: ['Passer au plan Pro + e-facture pour activer le module'],
		};
	}

	getPaConnectionStatus() {
		return this.paPartner.getStatus();
	}

	testPaConnection() {
		return this.paPartner.testConnection();
	}

	async getInvoiceReadiness(invoiceId: string, organizationId: number) {
		const invoice = await this.loadInvoice(invoiceId, organizationId);
		const orgEval = this.compliance.evaluateOrganization(invoice.organization);
		const clientEval = this.compliance.evaluateClient(invoice.client);
		const invEval = this.compliance.evaluateInvoice(
			invoice,
			orgEval.ready,
			clientEval.ready,
		);
		return {
			...invEval,
			status: invoice.eInvoiceStatus,
			organization: orgEval,
			client: clientEval,
		};
	}

	async generateFacturX(invoiceId: string, organizationId: number) {
		await this.billing.assertCanUseEInvoicing(organizationId);

		const invoice = await this.loadInvoice(invoiceId, organizationId);
		const readiness = await this.getInvoiceReadiness(invoiceId, organizationId);
		if (!readiness.canGenerateFacturX) {
			throw new ForbiddenException(
				'Facture non prête pour la facturation électronique. Corrigez les éléments signalés dans le rapport de conformité.',
			);
		}

		const organization = invoice.organization;
		if (!organization) throw new NotFoundException('Organisation introuvable');

		const { xml, hash } = this.facturX.generate({ ...invoice, organization });

		await this.prisma.invoice.update({
			where: { id: invoiceId },
			data: {
				eInvoiceStatus: EInvoiceStatus.XML_GENERATED,
				eInvoiceGeneratedAt: new Date(),
				eInvoiceXmlHash: hash,
			},
		});

		return {
			xml,
			hash,
			filename: `factur-x-${invoice.number.replace(/\//g, '-')}.xml`,
			disclaimer:
				'Fichier XML simplifié EN 16931 (Facturio). L’envoi via Plateforme Agréée sera disponible dans une prochaine version.',
		};
	}

	async submitInvoiceToPa(invoiceId: string, organizationId: number) {
		await this.billing.assertCanUseEInvoicing(organizationId);
		const invoice = await this.loadInvoice(invoiceId, organizationId);
		const readiness = await this.getInvoiceReadiness(invoiceId, organizationId);
		if (!readiness.canGenerateFacturX) {
			throw new ForbiddenException(
				'Facture non prête pour soumission PA. Corrigez les éléments signalés dans le rapport de conformité.',
			);
		}
		const generated = await this.generateFacturX(invoiceId, organizationId);
		const idempotencyKey = `pa-${invoice.id}-${invoice.eInvoiceXmlHash ?? generated.hash ?? 'x'}`;
		const result = await this.paPartner.submitInvoice({
			invoiceId: invoice.id,
			invoiceNumber: invoice.number,
			sellerSiret: invoice.organization?.siret,
			buyerSiren: invoice.client?.siren,
			facturXXml: generated.xml,
			idempotencyKey,
		});

		await this.prisma.invoice.update({
			where: { id: invoiceId },
			data: {
				eInvoiceStatus: result.status === 'accepted' ? EInvoiceStatus.PENDING_PA : EInvoiceStatus.ERROR,
			},
		});

		return {
			invoiceId,
			invoiceNumber: invoice.number,
			eInvoiceStatus: result.status === 'accepted' ? EInvoiceStatus.PENDING_PA : EInvoiceStatus.ERROR,
			idempotencyKey,
			pa: result,
		};
	}

	private async loadInvoice(invoiceId: string, organizationId: number) {
		const invoice = await this.prisma.invoice.findFirst({
			where: { id: invoiceId, organizationId },
			include: {
				lines: true,
				client: true,
				organization: true,
			},
		});
		if (!invoice) throw new NotFoundException('Facture introuvable');
		if (!invoice.organization) throw new NotFoundException('Organisation introuvable');
		return invoice;
	}
}
