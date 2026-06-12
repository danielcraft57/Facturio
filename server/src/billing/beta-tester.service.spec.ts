import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { SaasBillingPlan } from '@prisma/client';
import { BetaTesterService } from './beta-tester.service';

describe('BetaTesterService', () => {
	const prisma = {
		betaInviteCode: {
			count: jest.fn(),
			findUnique: jest.fn(),
			update: jest.fn(),
		},
		organization: {
			findUnique: jest.fn(),
			update: jest.fn(),
		},
		$transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
	};

	let service: BetaTesterService;

	beforeEach(() => {
		jest.clearAllMocks();
		process.env.BETA_TESTER_MAX_SLOTS = '2';
		process.env.BETA_TESTER_DURATION_DAYS = '90';
		process.env.BETA_TESTER_PLAN = 'AGENCY';
		service = new BetaTesterService(prisma as never);
	});

	it('valide un code disponible', async () => {
		prisma.betaInviteCode.count.mockResolvedValue(0);
		prisma.betaInviteCode.findUnique.mockResolvedValue({
			id: 1,
			code: 'FACTURIO-BETA-ABC123',
			redeemedAt: null,
			expiresAt: null,
		});

		const result = await service.validateCode('facturio-beta-abc123');
		expect(result.valid).toBe(true);
		expect(result.remainingSlots).toBe(2);
	});

	it('refuse un code déjà utilisé', async () => {
		prisma.betaInviteCode.count.mockResolvedValue(1);
		prisma.betaInviteCode.findUnique.mockResolvedValue({
			id: 1,
			code: 'FACTURIO-BETA-USED01',
			redeemedAt: new Date(),
			expiresAt: null,
		});

		const result = await service.validateCode('FACTURIO-BETA-USED01');
		expect(result.valid).toBe(false);
		expect(result.message).toContain('déjà été utilisé');
	});

	it('active le plan Agence pour une org Free', async () => {
		prisma.organization.findUnique.mockResolvedValue({
			id: 10,
			saasPlan: SaasBillingPlan.FREE,
			betaTesterAt: null,
			stripeSubscriptionId: null,
		});
		prisma.betaInviteCode.count.mockResolvedValue(0);
		prisma.betaInviteCode.findUnique.mockResolvedValue({
			id: 5,
			code: 'FACTURIO-BETA-NEW001',
			redeemedAt: null,
			expiresAt: null,
		});
		prisma.betaInviteCode.update.mockResolvedValue({});
		prisma.organization.update.mockResolvedValue({});

		const result = await service.redeemCode('FACTURIO-BETA-NEW001', 10);
		expect(result.plan).toBe(SaasBillingPlan.AGENCY);
		expect(result.durationDays).toBe(90);
		expect(prisma.$transaction).toHaveBeenCalled();
	});

	it('bloque si le plafond global est atteint', async () => {
		prisma.organization.findUnique.mockResolvedValue({
			id: 10,
			saasPlan: SaasBillingPlan.FREE,
			betaTesterAt: null,
			stripeSubscriptionId: null,
		});
		prisma.betaInviteCode.count.mockResolvedValue(2);
		prisma.betaInviteCode.findUnique.mockResolvedValue({
			id: 5,
			code: 'FACTURIO-BETA-LATE01',
			redeemedAt: null,
			expiresAt: null,
		});

		await expect(service.redeemCode('FACTURIO-BETA-LATE01', 10)).rejects.toBeInstanceOf(
			ForbiddenException,
		);
	});

	it('refuse une org déjà beta', async () => {
		prisma.organization.findUnique.mockResolvedValue({
			id: 10,
			saasPlan: SaasBillingPlan.AGENCY,
			betaTesterAt: new Date(),
			stripeSubscriptionId: null,
		});

		await expect(service.redeemCode('FACTURIO-BETA-X', 10)).rejects.toBeInstanceOf(
			ConflictException,
		);
	});

	it('refuse un code inconnu à l\'activation', async () => {
		prisma.organization.findUnique.mockResolvedValue({
			id: 10,
			saasPlan: SaasBillingPlan.FREE,
			betaTesterAt: null,
			stripeSubscriptionId: null,
		});
		prisma.betaInviteCode.count.mockResolvedValue(0);
		prisma.betaInviteCode.findUnique.mockResolvedValue(null);

		await expect(service.redeemCode('FACTURIO-BETA-NOPE', 10)).rejects.toBeInstanceOf(
			BadRequestException,
		);
	});
});
