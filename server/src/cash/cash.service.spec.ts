import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CashService } from './cash.service';
import { PrismaService } from '../prisma/prisma.service';
import { AccountingService } from '../accounting/accounting.service';

/**
 * Tests caisse / mouvements.
 */
describe('CashService', () => {
	const prisma = {
		cashRegister: {
			findMany: jest.fn(),
			findFirst: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
		},
		cashMovement: {
			create: jest.fn(),
		},
		$transaction: jest.fn(),
	};

	const accounting = { postEntry: jest.fn() };
	let service: CashService;

	beforeEach(() => {
		jest.clearAllMocks();
		service = new CashService(
			prisma as unknown as PrismaService,
			accounting as unknown as AccountingService,
		);
	});

	it('crée une caisse avec solde d\'ouverture', async () => {
		prisma.cashRegister.create.mockResolvedValue({
			id: 1,
			name: 'Caisse',
			openingBalance: 100,
			currentBalance: 100,
		});

		const reg = await service.createRegister(1, { name: 'Caisse', openingBalance: 100 });
		expect(reg.currentBalance).toBe(100);
	});

	it('refuse une sortie qui mettrait le solde négatif', async () => {
		prisma.cashRegister.findFirst.mockResolvedValue({
			id: 1,
			organizationId: 1,
			currentBalance: 50,
			movements: [],
		});

		await expect(
			service.addMovement(1, 1, { type: 'OUT', amount: 80, label: 'Trop' }),
		).rejects.toBeInstanceOf(BadRequestException);
	});

	it('enregistre une entrée et met à jour le solde', async () => {
		prisma.cashRegister.findFirst.mockResolvedValue({
			id: 1,
			organizationId: 1,
			currentBalance: 50,
			movements: [],
		});
		prisma.$transaction.mockResolvedValue([
			{ id: 10, type: 'IN', amount: 20, label: 'Vente' },
			{ currentBalance: 70 },
		]);

		const result = await service.addMovement(1, 1, {
			type: 'IN',
			amount: 20,
			label: 'Vente',
		});

		expect(result.currentBalance).toBe(70);
		expect(prisma.$transaction).toHaveBeenCalled();
	});

	it('getRegister lève NotFoundException', async () => {
		prisma.cashRegister.findFirst.mockResolvedValue(null);
		await expect(service.getRegister(1, 99)).rejects.toBeInstanceOf(NotFoundException);
	});
});
