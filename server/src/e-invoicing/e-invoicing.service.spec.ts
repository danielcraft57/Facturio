import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EInvoiceStatus, SaasBillingPlan } from '@prisma/client';
import { EInvoicingService } from './e-invoicing.service';
import { EInvoicingComplianceService } from './e-invoicing-compliance.service';
import { FacturXGeneratorService } from './factur-x-generator.service';
import { BillingService } from '../billing/billing.service';

describe('EInvoicingService', () => {
	const prisma = {
		organization: { findUnique: jest.fn() },
		invoice: { findFirst: jest.fn(), update: jest.fn() },
	};

	const billing = {
		getOrganizationPlan: jest.fn(),
		hasFeature: jest.fn(),
		assertCanUseEInvoicing: jest.fn(),
	};

	let service: EInvoicingService;
	const compliance = new EInvoicingComplianceService();
	const facturX = new FacturXGeneratorService();

	const completeOrg = {
		id: 1,
		name: 'Org',
		siret: '12345678901234',
		siren: '123456789',
		vatNumber: 'FR12345678901',
		address: '1 rue Test',
		zipCode: '75001',
		city: 'Paris',
		countryCode: 'FR',
		email: 'org@test.com',
	};

	const completeClient = {
		name: 'Client B2B',
		isCompany: true,
		companyName: 'Client B2B',
		siren: '987654321',
		vatNumber: 'FR98765432109',
		address: '2 rue Client',
		countryCode: 'FR',
		email: 'b2b@test.com',
	};

	beforeEach(() => {
		jest.clearAllMocks();
		service = new EInvoicingService(prisma as any, compliance, facturX, billing as unknown as BillingService);
	});

	describe('getOrganizationReadiness', () => {
		it('retourne planAllowsEInvoicing selon le plan SaaS', async () => {
			prisma.organization.findUnique.mockResolvedValue(completeOrg);
			billing.getOrganizationPlan.mockResolvedValue(SaasBillingPlan.PRO_EFACTURE);
			billing.hasFeature.mockReturnValue(true);

			const result = await service.getOrganizationReadiness(1);

			expect(result.planAllowsEInvoicing).toBe(true);
			expect(result.paConnected).toBe(false);
			expect(result.reformDates?.reception).toBe('2026-09-01');
		});

		it('lève NotFoundException si organisation absente', async () => {
			prisma.organization.findUnique.mockResolvedValue(null);
			await expect(service.getOrganizationReadiness(99)).rejects.toBeInstanceOf(NotFoundException);
		});
	});

	describe('generateFacturX', () => {
		const readyInvoice = {
			id: 10,
			number: 'FAC-001',
			status: 'SENT',
			sentAt: new Date(),
			date: new Date(),
			dueDate: null,
			currency: 'EUR',
			subtotal: 100,
			tax: 20,
			total: 120,
			legalMention: null,
			eInvoiceStatus: EInvoiceStatus.NOT_READY,
			lines: [{ description: 'Ligne', quantity: 1, unitPrice: 100, total: 100, taxRate: 0.2 }],
			client: completeClient,
			organization: completeOrg,
		};

		it('génère le XML et met à jour le statut e-facture', async () => {
			billing.assertCanUseEInvoicing.mockResolvedValue(undefined);
			prisma.invoice.findFirst.mockResolvedValue(readyInvoice);
			prisma.invoice.update.mockResolvedValue({});

			const result = await service.generateFacturX('10', 1);

			expect(result.xml).toContain('FacturioCrossIndustryInvoice');
			expect(result.filename).toContain('FAC-001');
			expect(prisma.invoice.update).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { id: '10' },
					data: expect.objectContaining({
						eInvoiceStatus: EInvoiceStatus.XML_GENERATED,
						eInvoiceXmlHash: expect.any(String),
					}),
				}),
			);
		});

		it('refuse si la facture n’est pas prête', async () => {
			billing.assertCanUseEInvoicing.mockResolvedValue(undefined);
			prisma.invoice.findFirst.mockResolvedValue({
				...readyInvoice,
				status: 'DRAFT',
				sentAt: null,
			});

			await expect(service.generateFacturX('10', 1)).rejects.toBeInstanceOf(ForbiddenException);
		});

		it('propage le refus de plan Free', async () => {
			billing.assertCanUseEInvoicing.mockRejectedValue(
				new ForbiddenException('La facturation électronique (Factur-X) est réservée au plan Pro + e-facture.'),
			);

			await expect(service.generateFacturX('10', 1)).rejects.toBeInstanceOf(ForbiddenException);
		});
	});
});
