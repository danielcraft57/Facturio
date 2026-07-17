import { BadRequestException } from '@nestjs/common';
import { TreasuryService } from './treasury.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Tests prévision trésorerie.
 */
describe('TreasuryService', () => {
	const prisma = {
		invoice: { findMany: jest.fn() },
		payableDebt: { findMany: jest.fn() },
		cashRegister: { findMany: jest.fn() },
		payment: { findMany: jest.fn() },
	};

	let service: TreasuryService;

	beforeEach(() => {
		jest.clearAllMocks();
		service = new TreasuryService(prisma as unknown as PrismaService);
		prisma.invoice.findMany.mockResolvedValue([]);
		prisma.payableDebt.findMany.mockResolvedValue([]);
		prisma.cashRegister.findMany.mockResolvedValue([{ currentBalance: 1000 }]);
		prisma.payment.findMany.mockResolvedValue([]);
	});

	it('refuse sans organisation', async () => {
		await expect(service.getForecast(undefined)).rejects.toBeInstanceOf(BadRequestException);
	});

	it('projette encaissements et décaissements sur l\'horizon', async () => {
		const in10 = new Date();
		in10.setDate(in10.getDate() + 10);
		prisma.invoice.findMany.mockResolvedValue([
			{ number: 'FAC-1', dueDate: in10, balance: 500 },
		]);
		prisma.payableDebt.findMany.mockResolvedValue([
			{
				label: 'Loyer',
				dueDate: in10,
				balance: 200,
				creditor: { name: 'Proprio' },
			},
		]);

		const forecast = await service.getForecast(1, 30);

		expect(forecast.horizonDays).toBe(30);
		expect(forecast.totalInflows).toBe(500);
		expect(forecast.totalOutflows).toBe(200);
		expect(forecast.upcomingReceivables[0].label).toContain('FAC-1');
		expect(forecast.points.length).toBe(31);
	});

	it('borne l\'horizon entre 7 et 365 jours', async () => {
		const short = await service.getForecast(1, 2);
		expect(short.horizonDays).toBe(7);
		const long = await service.getForecast(1, 999);
		expect(long.horizonDays).toBe(365);
	});
});
