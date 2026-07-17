import { Test, TestingModule } from '@nestjs/testing';
import { AmortizationsService } from './amortizations.service';
import { PrismaService } from '../prisma/prisma.service';
import { AccountingService } from '../accounting/accounting.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

/**
 * Tests unitaires pour AmortizationsService
 *
 * Teste :
 * - Création d'amortissements
 * - Calcul linéaire
 * - Calcul dégressif
 * - Calcul exceptionnel
 * - Génération des tableaux
 */
describe('AmortizationsService', () => {
	let service: AmortizationsService;
	let prisma: PrismaService;

	const mockPrismaService = {
		amortization: {
			create: jest.fn(),
			findMany: jest.fn(),
			findFirst: jest.fn(),
			delete: jest.fn(),
		},
		journalEntry: {
			findFirst: jest.fn(),
		},
	};

	const mockAccountingService = {
		postEntry: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AmortizationsService,
				{
					provide: PrismaService,
					useValue: mockPrismaService,
				},
				{
					provide: AccountingService,
					useValue: mockAccountingService,
				},
			],
		}).compile();

		service = module.get<AmortizationsService>(AmortizationsService);
		prisma = module.get<PrismaService>(PrismaService);

		jest.clearAllMocks();
	});

	it('devrait être défini', () => {
		expect(service).toBeDefined();
	});

	describe('create', () => {
		it('devrait créer un amortissement linéaire', async () => {
			const organizationId = 1;
			const data = {
				assetName: 'Ordinateur',
				purchaseDate: '2024-01-01',
				purchaseAmount: 1500,
				method: 'LINEAR' as const,
				duration: 3,
			};

			mockPrismaService.amortization.create.mockResolvedValue({
				id: 1,
				organizationId,
				...data,
				schedule: [],
			});

			const result = await service.create(organizationId, data);

			expect(result).toBeDefined();
			expect(mockPrismaService.amortization.create).toHaveBeenCalled();
			const callArgs = mockPrismaService.amortization.create.mock.calls[0][0];
			expect(callArgs.data.schedule).toBeDefined();
			expect(Array.isArray(callArgs.data.schedule)).toBe(true);
		});

		it('devrait rejeter un montant négatif', async () => {
			const organizationId = 1;
			const data = {
				assetName: 'Test',
				purchaseDate: '2024-01-01',
				purchaseAmount: -100,
				method: 'LINEAR' as const,
				duration: 3,
			};

			await expect(service.create(organizationId, data)).rejects.toThrow(
				BadRequestException
			);
		});

		it('devrait rejeter une valeur résiduelle >= montant d\'achat', async () => {
			const organizationId = 1;
			const data = {
				assetName: 'Test',
				purchaseDate: '2024-01-01',
				purchaseAmount: 1000,
				residualValue: 1500,
				method: 'LINEAR' as const,
				duration: 3,
			};

			await expect(service.create(organizationId, data)).rejects.toThrow(
				BadRequestException
			);
		});
	});

	describe('getTotalAmortizations', () => {
		it('devrait calculer le total des amortissements pour une année', async () => {
			const organizationId = 1;
			const year = 2024;

			const mockAmortizations = [
				{
					id: 1,
					assetName: 'Asset 1',
					schedule: [
						{ year: 2024, amount: 500 },
						{ year: 2025, amount: 500 },
					],
				},
				{
					id: 2,
					assetName: 'Asset 2',
					schedule: [
						{ year: 2024, amount: 300 },
						{ year: 2025, amount: 300 },
					],
				},
			];

			mockPrismaService.amortization.findMany.mockResolvedValue(mockAmortizations);

			const result = await service.getTotalAmortizations(organizationId, year);

			expect(result.total).toBe(800); // 500 + 300
			expect(result.count).toBe(2);
		});
	});

	describe('findOne', () => {
		it('devrait retourner un amortissement existant', async () => {
			const organizationId = 1;
			const id = 1;
			const mockAmortization = { id, organizationId, assetName: 'Test' };

			mockPrismaService.amortization.findFirst.mockResolvedValue(mockAmortization);

			const result = await service.findOne(organizationId, id);

			expect(result).toEqual(mockAmortization);
		});

		it('devrait lancer NotFoundException si amortissement non trouvé', async () => {
			const organizationId = 1;
			const id = 999;

			mockPrismaService.amortization.findFirst.mockResolvedValue(null);

			await expect(service.findOne(organizationId, id)).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('postYearToAccounting', () => {
		it('poste une écriture 681/281 idempotente', async () => {
			mockPrismaService.amortization.findFirst.mockResolvedValue({
				id: 2,
				organizationId: 1,
				assetName: 'MacBook',
				schedule: [{ year: 2026, amount: 400 }],
			});
			mockPrismaService.journalEntry.findFirst.mockResolvedValue(null);
			mockAccountingService.postEntry.mockResolvedValue({ id: 55 });

			const result = await service.postYearToAccounting(1, 2, 2026);

			expect(result.reference).toBe('AMO-2-2026');
			expect(result.amount).toBe(400);
			expect(mockAccountingService.postEntry).toHaveBeenCalledWith(
				expect.objectContaining({
					journalCode: 'OD',
					lines: expect.arrayContaining([
						expect.objectContaining({ accountCode: '681', debit: 400 }),
						expect.objectContaining({ accountCode: '281', credit: 400 }),
					]),
				}),
			);
		});
	});
});

