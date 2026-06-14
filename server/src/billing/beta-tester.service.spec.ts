import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { SaasBillingPlan } from '@prisma/client';
import { BetaTesterService } from './beta-tester.service';

describe('BetaTesterService', () => {
	const prisma = {
		betaInviteCode: {
			findUnique: jest.fn(),
			findMany: jest.fn(),
			update: jest.fn(),
		},
		betaInviteRedemption: {
			create: jest.fn(),
			count: jest.fn(),
		},
		user: {
			findFirst: jest.fn(),
		},
		organization: {
			findUnique: jest.fn(),
			count: jest.fn(),
			update: jest.fn(),
		},
		$transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
	};

	let service: BetaTesterService;
	const email = {
		sendBetaTesterWelcome: jest.fn().mockResolvedValue(undefined),
	};

	beforeEach(() => {
		jest.clearAllMocks();
		process.env.BETA_TESTER_MAX_SLOTS = '20';
		process.env.BETA_TESTER_DURATION_DAYS = '90';
		process.env.BETA_TESTER_PLAN = 'AGENCY';
		process.env.BETA_TESTER_CODE_MIN_LENGTH = '3';
		process.env.BETA_TESTER_CODE_MAX_LENGTH = '6';
		process.env.FRONTEND_URL = 'http://localhost:5173';
		service = new BetaTesterService(prisma as never, email as never);
	});

	it('valide un code actif réutilisable', async () => {
		prisma.organization.count.mockResolvedValue(5);
		prisma.betaInviteCode.findUnique.mockResolvedValue({
			id: 1,
			code: 'DEV26',
			active: true,
			expiresAt: null,
			maxRedemptions: null,
			redemptionCount: 12,
		});

		const result = await service.validateCode('dev26');
		expect(result.valid).toBe(true);
		expect(result.remainingSlots).toBe(15);
	});

	it('refuse un code inactif', async () => {
		prisma.organization.count.mockResolvedValue(0);
		prisma.betaInviteCode.findUnique.mockResolvedValue({
			id: 1,
			code: 'OLD',
			active: false,
			expiresAt: null,
			maxRedemptions: null,
			redemptionCount: 0,
		});

		const result = await service.validateCode('OLD');
		expect(result.valid).toBe(false);
		expect(result.message).toContain('plus actif');
	});

	it('refuse un code trop long', async () => {
		prisma.organization.count.mockResolvedValue(0);

		const result = await service.validateCode('FACTURIO-BETA');
		expect(result.valid).toBe(false);
		expect(result.message).toContain('6 caractères');
	});

	it('active le plan Agence pour une org Free', async () => {
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 90);
		prisma.organization.findUnique
			.mockResolvedValueOnce({
				id: 10,
				saasPlan: SaasBillingPlan.FREE,
				betaTesterAt: null,
				stripeSubscriptionId: null,
			})
			.mockResolvedValueOnce({
				betaTesterAt: new Date(),
				betaWelcomeEmailSentAt: null,
				saasPlanExpiresAt: expiresAt,
				saasPlan: SaasBillingPlan.AGENCY,
			})
			.mockResolvedValueOnce({ email: null });
		prisma.organization.count.mockResolvedValue(2);
		prisma.betaInviteCode.findUnique.mockResolvedValue({
			id: 5,
			code: 'DEV26',
			active: true,
			expiresAt: null,
			maxRedemptions: null,
			redemptionCount: 3,
		});
		prisma.betaInviteRedemption.create.mockResolvedValue({});
		prisma.betaInviteCode.update.mockResolvedValue({});
		prisma.organization.update.mockResolvedValue({});
		prisma.user.findFirst.mockResolvedValue({
			email: 'beta@example.com',
			firstName: 'Alex',
		});

		const result = await service.redeemCode('DEV26', 10);
		expect(result.plan).toBe(SaasBillingPlan.AGENCY);
		expect(prisma.$transaction).toHaveBeenCalled();
		await new Promise((r) => setImmediate(r));
		expect(email.sendBetaTesterWelcome).toHaveBeenCalledWith(
			expect.objectContaining({ to: 'beta@example.com', firstName: 'Alex', inviteCode: 'DEV26' }),
		);
	});

	it('bloque si le plafond global est atteint', async () => {
		process.env.BETA_TESTER_MAX_SLOTS = '2';
		prisma.organization.findUnique.mockResolvedValue({
			id: 10,
			saasPlan: SaasBillingPlan.FREE,
			betaTesterAt: null,
			stripeSubscriptionId: null,
		});
		prisma.organization.count.mockResolvedValue(2);
		prisma.betaInviteCode.findUnique.mockResolvedValue({
			id: 5,
			code: 'DEV26',
			active: true,
			expiresAt: null,
			maxRedemptions: null,
			redemptionCount: 1,
		});

		await expect(service.redeemCode('DEV26', 10)).rejects.toBeInstanceOf(ForbiddenException);
	});

	it('refuse une org déjà beta', async () => {
		prisma.organization.findUnique.mockResolvedValue({
			id: 10,
			saasPlan: SaasBillingPlan.AGENCY,
			betaTesterAt: new Date(),
			stripeSubscriptionId: null,
		});

		await expect(service.redeemCode('DEV26', 10)).rejects.toBeInstanceOf(ConflictException);
	});

	it('expose les stats publiques', async () => {
		prisma.organization.count
			.mockResolvedValueOnce(4)
			.mockResolvedValueOnce(3);
		prisma.betaInviteCode.findMany.mockResolvedValue([
			{
				code: 'DEV26',
				label: 'Twitter',
				redemptionCount: 2,
				maxRedemptions: null,
				expiresAt: null,
			},
		]);

		const stats = await service.getPublicStats();
		expect(stats.maxSlots).toBe(20);
		expect(stats.enrolledCount).toBe(4);
		expect(stats.remainingSlots).toBe(16);
		expect(stats.campaignCodes[0].code).toBe('DEV26');
	});
});
