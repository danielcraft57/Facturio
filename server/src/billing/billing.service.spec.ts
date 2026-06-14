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
		quote: {
			count: jest.fn(),
		},
		emailEvent: {
			count: jest.fn(),
		},
		user: {
			count: jest.fn(),
		},
	};

	const betaTester = {
		getBetaTesterStatus: jest.fn().mockResolvedValue(null),
		getOrganizationContact: jest.fn().mockResolvedValue(null),
	};

	const email = {
		sendFreeQuotaReached: jest.fn().mockResolvedValue(undefined),
	};

	let service: BillingService;

	beforeEach(() => {
		jest.clearAllMocks();
		betaTester.getBetaTesterStatus.mockResolvedValue(null);
		service = new BillingService(prisma as never, betaTester as never, email as never);
	});

	it('expose la période de reset mensuel dans getUsage', async () => {
		prisma.organization.findUnique.mockResolvedValue({
			saasPlan: SaasBillingPlan.FREE,
			saasPlanExpiresAt: null,
			saasSubscriptionStatus: null,
			stripeCustomerId: null,
			stripeSubscriptionId: null,
		});
		prisma.invoice.count.mockResolvedValue(3);
		prisma.quote.count.mockResolvedValue(1);
		prisma.emailEvent.count.mockResolvedValue(2);

		const usage = await service.getUsage(1);
		expect(usage.billingPeriod?.resetsAt).toBeDefined();
		const resets = new Date(usage.billingPeriod!.resetsAt);
		expect(resets.getDate()).toBe(1);
		expect(resets.getTime()).toBeGreaterThan(Date.now());
	});

	it('bloque la création si quota Free atteint', async () => {
		prisma.organization.findUnique.mockResolvedValue({
			saasPlan: SaasBillingPlan.FREE,
			saasPlanExpiresAt: null,
			saasSubscriptionStatus: null,
			stripeCustomerId: null,
			stripeSubscriptionId: null,
		});
		prisma.invoice.count.mockResolvedValue(25);
		prisma.quote.count.mockResolvedValue(0);
		prisma.emailEvent.count.mockResolvedValue(0);

		await expect(service.assertCanCreateInvoice(1)).rejects.toBeInstanceOf(ForbiddenException);
	});

	it('bloque la création de devis si quota Free atteint', async () => {
		prisma.organization.findUnique.mockResolvedValue({
			saasPlan: SaasBillingPlan.FREE,
			saasPlanExpiresAt: null,
			saasSubscriptionStatus: null,
			stripeCustomerId: null,
			stripeSubscriptionId: null,
		});
		prisma.invoice.count.mockResolvedValue(0);
		prisma.quote.count.mockResolvedValue(10);
		prisma.emailEvent.count.mockResolvedValue(0);

		await expect(service.assertCanCreateQuote(1)).rejects.toBeInstanceOf(ForbiddenException);
	});

	it('bloque la comptabilité sur plan Free', async () => {
		prisma.organization.findUnique.mockResolvedValue({
			saasPlan: SaasBillingPlan.FREE,
			saasPlanExpiresAt: null,
		});

		await expect(service.assertCanUseAccounting(1)).rejects.toBeInstanceOf(ForbiddenException);
	});

	it('bloque le module finance sur plan Free', async () => {
		prisma.organization.findUnique.mockResolvedValue({
			saasPlan: SaasBillingPlan.FREE,
			saasPlanExpiresAt: null,
		});

		await expect(service.assertCanUseFinanceModule(1)).rejects.toBeInstanceOf(ForbiddenException);
	});

	it('autorise Pro sans limite', async () => {
		prisma.organization.findUnique.mockResolvedValue({ saasPlan: SaasBillingPlan.PRO, saasPlanExpiresAt: null });
		prisma.invoice.count.mockResolvedValue(100);

		await expect(service.assertCanCreateInvoice(1)).resolves.toBeUndefined();
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

	it('bloque l’API publique sur plan Free', async () => {
		prisma.organization.findUnique.mockResolvedValue({ saasPlan: SaasBillingPlan.FREE, saasPlanExpiresAt: null });

		await expect(service.assertCanUsePublicApi(1)).rejects.toBeInstanceOf(ForbiddenException);
	});

	it('autorise l’API publique sur plan Pro', async () => {
		prisma.organization.findUnique.mockResolvedValue({ saasPlan: SaasBillingPlan.PRO, saasPlanExpiresAt: null });

		await expect(service.assertCanUsePublicApi(1)).resolves.toBeUndefined();
	});

	it('expose publicApi sur Pro, Pro+e-facture et Agence', () => {
		expect(service.hasFeature(SaasBillingPlan.FREE, 'publicApi')).toBe(false);
		expect(service.hasFeature(SaasBillingPlan.PRO, 'publicApi')).toBe(true);
		expect(service.hasFeature(SaasBillingPlan.PRO_EFACTURE, 'publicApi')).toBe(true);
		expect(service.hasFeature(SaasBillingPlan.AGENCY, 'publicApi')).toBe(true);
	});
});
