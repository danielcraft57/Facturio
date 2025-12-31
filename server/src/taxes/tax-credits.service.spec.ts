import { Test, TestingModule } from '@nestjs/testing';
import { TaxCreditsService } from './tax-credits.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

/**
 * Tests unitaires pour TaxCreditsService
 * 
 * Teste :
 * - Calcul des crédits d'impôt éligibles
 * - Création de crédits
 * - Calcul des totaux
 */
describe('TaxCreditsService', () => {
	let service: TaxCreditsService;
	let prisma: PrismaService;

	const mockPrismaService = {
		taxCredit: {
			create: jest.fn(),
			findMany: jest.fn(),
			findFirst: jest.fn(),
			update: jest.fn(),
		},
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TaxCreditsService,
				{
					provide: PrismaService,
					useValue: mockPrismaService,
				},
			],
		}).compile();

		service = module.get<TaxCreditsService>(TaxCreditsService);
		prisma = module.get<PrismaService>(PrismaService);

		jest.clearAllMocks();
	});

	it('devrait être défini', () => {
		expect(service).toBeDefined();
	});

	describe('calculateEligibleCredits', () => {
		it('devrait calculer le CIR pour des dépenses R&D', async () => {
			const organizationId = 1;
			const year = 2024;
			const expenses = { rnd: 10000 };

			const result = await service.calculateEligibleCredits(organizationId, year, expenses);

			expect(result.credits).toHaveLength(1);
			expect(result.credits[0].type).toBe('CIR');
			expect(result.credits[0].creditAmount).toBe(3000); // 10000 * 0.30
			expect(result.totalCredit).toBe(3000);
		});

		it('devrait calculer plusieurs crédits', async () => {
			const organizationId = 1;
			const year = 2024;
			const expenses = {
				rnd: 10000,
				innovation: 5000,
				formation: 2000,
			};

			const result = await service.calculateEligibleCredits(organizationId, year, expenses);

			expect(result.credits).toHaveLength(3);
			expect(result.totalCredit).toBeGreaterThan(0);
		});

		it('devrait retourner une liste vide si aucune dépense', async () => {
			const organizationId = 1;
			const year = 2024;
			const expenses = {};

			const result = await service.calculateEligibleCredits(organizationId, year, expenses);

			expect(result.credits).toHaveLength(0);
			expect(result.totalCredit).toBe(0);
		});
	});

	describe('create', () => {
		it('devrait créer un crédit d\'impôt', async () => {
			const organizationId = 1;
			const data = {
				type: 'CIR' as const,
				name: 'Crédit R&D',
				eligibleAmount: 10000,
				year: 2024,
			};

			mockPrismaService.taxCredit.create.mockResolvedValue({
				id: 1,
				organizationId,
				...data,
				rate: 0.30,
				creditAmount: 3000,
				status: 'ELIGIBLE',
			});

			const result = await service.create(organizationId, data);

			expect(result).toBeDefined();
			expect(result.creditAmount).toBe(3000);
		});
	});

	describe('getTotalCredits', () => {
		it('devrait calculer le total des crédits pour une année', async () => {
			const organizationId = 1;
			const year = 2024;

			const mockCredits = [
				{ type: 'CIR', creditAmount: 3000 },
				{ type: 'CII', creditAmount: 1000 },
			];

			mockPrismaService.taxCredit.findMany.mockResolvedValue(mockCredits);

			const result = await service.getTotalCredits(organizationId, year);

			expect(result.total).toBe(4000);
			expect(result.count).toBe(2);
		});
	});
});

