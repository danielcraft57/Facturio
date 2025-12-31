import { Test, TestingModule } from '@nestjs/testing';
import { CompensationOptimizationService } from './compensation-optimization.service';
import { ConfigService } from '../config/config.service';

/**
 * Tests unitaires pour CompensationOptimizationService
 * 
 * Teste :
 * - Calcul salaire
 * - Calcul dividendes
 * - Optimisation mixte
 * - Recommandations
 */
describe('CompensationOptimizationService', () => {
	let service: CompensationOptimizationService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				CompensationOptimizationService,
				{
					provide: ConfigService,
					useValue: {
						socialRateEmployee: 0.22,
						socialRateEmployer: 0.45,
						irRateTranche1: 0,
						irThresholdTranche1: 10777,
						irRateTranche2: 0.11,
						irThresholdTranche2: 27478,
						irRateTranche3: 0.30,
						irThresholdTranche3: 78570,
						irRateTranche4: 0.41,
						irThresholdTranche4: 168994,
						irRateTranche5: 0.45,
						isRateTranche1: 0.15,
						isThresholdTranche1: 38120,
						isRateTranche2: 0.28,
						isThresholdTranche2: 75000,
						isRateTranche3: 0.31,
					},
				},
			],
		}).compile();

		service = module.get<CompensationOptimizationService>(CompensationOptimizationService);
	});

	it('devrait être défini', () => {
		expect(service).toBeDefined();
	});

	describe('optimize', () => {
		it('devrait optimiser la rémunération pour un montant donné', async () => {
			const totalAmount = 50000;
			const result = await service.optimize(totalAmount);

			expect(result).toBeDefined();
			expect(result.totalAmount).toBe(totalAmount);
			expect(result.salary).toBeDefined();
			expect(result.dividends).toBeDefined();
			expect(result.recommendation).toBeDefined();
			expect(['SALARY', 'DIVIDENDS', 'MIXED']).toContain(result.recommendation.bestOption);
		});

		it('devrait calculer correctement le coût salaire', async () => {
			const totalAmount = 50000;
			const result = await service.optimize(totalAmount);

			expect(result.salary.grossSalary).toBe(totalAmount);
			expect(result.salary.totalCost).toBeGreaterThan(totalAmount); // Coût employeur > salaire brut
			expect(result.salary.netSalary).toBeLessThan(totalAmount); // Net < brut
		});

		it('devrait calculer correctement le coût dividendes', async () => {
			const totalAmount = 50000;
			const result = await service.optimize(totalAmount);

			expect(result.dividends.grossDividends).toBe(totalAmount);
			expect(result.dividends.totalCost).toBeGreaterThan(0);
			expect(result.dividends.netDividends).toBeLessThan(totalAmount);
		});

		it('devrait fournir une recommandation avec économies', async () => {
			const totalAmount = 100000;
			const result = await service.optimize(totalAmount);

			expect(result.recommendation.savings).toBeGreaterThanOrEqual(0);
			expect(result.recommendation.explanation).toBeDefined();
		});
	});
});

