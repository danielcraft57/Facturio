import { Test, TestingModule } from '@nestjs/testing';
import { TaxDeductionsService } from './tax-deductions.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

/**
 * Tests unitaires pour TaxDeductionsService
 * 
 * Teste :
 * - Création de déductions fiscales
 * - Validation des données
 * - Calcul des totaux
 * - Validation/rejet des déductions
 */
describe('TaxDeductionsService', () => {
	let service: TaxDeductionsService;
	let prisma: PrismaService;

	const mockPrismaService = {
		taxDeduction: {
			create: jest.fn(),
			findMany: jest.fn(),
			findFirst: jest.fn(),
			findUnique: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			count: jest.fn(),
		},
		invoice: {
			findUnique: jest.fn(),
		},
		$transaction: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TaxDeductionsService,
				{
					provide: PrismaService,
					useValue: mockPrismaService,
				},
			],
		}).compile();

		service = module.get<TaxDeductionsService>(TaxDeductionsService);
		prisma = module.get<PrismaService>(PrismaService);

		jest.clearAllMocks();
	});

	it('devrait être défini', () => {
		expect(service).toBeDefined();
	});

	describe('create', () => {
		it('devrait créer une déduction fiscale', async () => {
			const organizationId = 1;
			const data = {
				category: 'EXPENSE' as const,
				name: 'Frais de déplacement',
				amount: 500,
				year: 2024,
			};

			mockPrismaService.taxDeduction.create.mockResolvedValue({
				id: 1,
				organizationId,
				...data,
				deductibleRate: 1.0,
				status: 'PENDING',
			});

			const result = await service.create(organizationId, data);

			expect(result).toBeDefined();
			expect(mockPrismaService.taxDeduction.create).toHaveBeenCalledWith({
				data: expect.objectContaining({
					organizationId,
					category: data.category,
					name: data.name,
					amount: data.amount,
					year: data.year,
					deductibleRate: 1.0,
					status: 'PENDING',
				}),
				include: {
					invoice: true,
					document: true,
				},
			});
		});

		it('devrait rejeter un montant négatif', async () => {
			const organizationId = 1;
			const data = {
				category: 'EXPENSE' as const,
				name: 'Test',
				amount: -100,
				year: 2024,
			};

			await expect(service.create(organizationId, data)).rejects.toThrow(
				BadRequestException
			);
		});

		it('devrait valider que la facture existe si fournie', async () => {
			const organizationId = 1;
			const data = {
				category: 'EXPENSE' as const,
				name: 'Test',
				amount: 500,
				year: 2024,
				invoiceId: '1',
			};

			mockPrismaService.invoice.findUnique.mockResolvedValue(null);

			await expect(service.create(organizationId, data)).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('findAll', () => {
		it('devrait retourner une liste paginée de déductions', async () => {
			const organizationId = 1;
			const mockDeductions = [
				{ id: 1, name: 'Déduction 1', amount: 100 },
				{ id: 2, name: 'Déduction 2', amount: 200 },
			];

			mockPrismaService.$transaction.mockResolvedValue([
				mockDeductions,
				2,
			]);

			const result = await service.findAll(organizationId, { page: 1, pageSize: 20 });

			expect(result.items).toEqual(mockDeductions);
			expect(result.total).toBe(2);
		});
	});

	describe('findOne', () => {
		it('devrait retourner une déduction existante', async () => {
			const organizationId = 1;
			const id = 1;
			const mockDeduction = { id, organizationId, name: 'Test' };

			mockPrismaService.taxDeduction.findFirst.mockResolvedValue(mockDeduction);

			const result = await service.findOne(organizationId, id);

			expect(result).toEqual(mockDeduction);
		});

		it('devrait lancer NotFoundException si déduction non trouvée', async () => {
			const organizationId = 1;
			const id = 999;

			mockPrismaService.taxDeduction.findFirst.mockResolvedValue(null);

			await expect(service.findOne(organizationId, id)).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('getTotalDeductions', () => {
		it('devrait calculer le total des déductions validées', async () => {
			const organizationId = 1;
			const year = 2024;
			const mockDeductions = [
				{ amount: 100, deductibleRate: 1.0, category: 'EXPENSE' },
				{ amount: 200, deductibleRate: 0.5, category: 'EXPENSE' },
			];

			mockPrismaService.taxDeduction.findMany.mockResolvedValue(mockDeductions);

			const result = await service.getTotalDeductions(organizationId, year);

			expect(result.total).toBe(200); // 100 * 1.0 + 200 * 0.5
			expect(result.count).toBe(2);
		});
	});

	describe('validate', () => {
		it('devrait valider une déduction', async () => {
			const organizationId = 1;
			const id = 1;

			mockPrismaService.taxDeduction.findFirst.mockResolvedValue({ id, organizationId });
			mockPrismaService.taxDeduction.update.mockResolvedValue({
				id,
				status: 'VALIDATED',
			});

			const result = await service.validate(organizationId, id);

			expect(mockPrismaService.taxDeduction.update).toHaveBeenCalledWith({
				where: { id },
				data: { status: 'VALIDATED' },
				include: {
					invoice: true,
					document: true,
				},
			});
		});
	});
});

