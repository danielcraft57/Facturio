import { ForbiddenException } from '@nestjs/common';
import { BillingService } from './billing.service';
import { SaasBillingPlan } from '@prisma/client';

describe('BillingService', () => {
	const prisma = {
		organization: {
			findUnique: jest.fn(),
		},
		invoice: {
			count: jest.fn(),
		},
	};

	let service: BillingService;

	beforeEach(() => {
		jest.clearAllMocks();
		service = new BillingService(prisma as any);
	});

	it('bloque la création si quota Free atteint', async () => {
		prisma.organization.findUnique.mockResolvedValue({ saasPlan: SaasBillingPlan.FREE, saasPlanExpiresAt: null });
		prisma.invoice.count.mockResolvedValue(10);

		await expect(service.assertCanCreateInvoice(1)).rejects.toBeInstanceOf(ForbiddenException);
	});

	it('autorise Pro sans limite', async () => {
		prisma.organization.findUnique.mockResolvedValue({ saasPlan: SaasBillingPlan.PRO, saasPlanExpiresAt: null });
		prisma.invoice.count.mockResolvedValue(100);

		await expect(service.assertCanCreateInvoice(1)).resolves.toBeUndefined();
	});

	it('bloque la prospection sur plan Free', async () => {
		prisma.organization.findUnique.mockResolvedValue({ saasPlan: SaasBillingPlan.FREE, saasPlanExpiresAt: null });

		await expect(service.assertCanUseProspection(1)).rejects.toBeInstanceOf(ForbiddenException);
	});

	it('autorise la prospection sur plan Pro', async () => {
		prisma.organization.findUnique.mockResolvedValue({ saasPlan: SaasBillingPlan.PRO, saasPlanExpiresAt: null });

		await expect(service.assertCanUseProspection(1)).resolves.toBeUndefined();
	});

	it('bloque Factur-X sur plan Free', async () => {
		prisma.organization.findUnique.mockResolvedValue({ saasPlan: SaasBillingPlan.FREE, saasPlanExpiresAt: null });

		await expect(service.assertCanUseEInvoicing(1)).rejects.toBeInstanceOf(ForbiddenException);
	});

	it('autorise Factur-X sur plan Pro + e-facture', async () => {
		prisma.organization.findUnique.mockResolvedValue({
			saasPlan: SaasBillingPlan.PRO_EFACTURE,
			saasPlanExpiresAt: null,
		});

		await expect(service.assertCanUseEInvoicing(1)).resolves.toBeUndefined();
	});

	it('expose eInvoicing uniquement sur PRO_EFACTURE et AGENCY', () => {
		expect(service.hasFeature(SaasBillingPlan.FREE, 'eInvoicing')).toBe(false);
		expect(service.hasFeature(SaasBillingPlan.PRO, 'eInvoicing')).toBe(false);
		expect(service.hasFeature(SaasBillingPlan.PRO_EFACTURE, 'eInvoicing')).toBe(true);
		expect(service.hasFeature(SaasBillingPlan.AGENCY, 'eInvoicing')).toBe(true);
	});
});
