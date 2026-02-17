import { Controller, Post, Body } from '@nestjs/common';
import { CompensationOptimizationService } from './compensation-optimization.service';

/**
 * Controller pour l'optimisation de rémunération
 *
 * @see CompensationOptimizationService pour la logique métier
 */
@Controller('taxes/compensation')
export class CompensationOptimizationController {
	constructor(private readonly compensationOptimizationService: CompensationOptimizationService) {}

	/**
	 * Optimise la rémunération (salaire vs dividendes)
	 * 
	 * @param body - Montant total, bénéfice actuel, statut PME
	 * @returns Comparaison salaire vs dividendes avec recommandation
	 */
	@Post('optimize')
	optimize(
		@Body()
		body: {
			totalAmount: number;
			currentProfit?: number;
			isPME?: boolean;
		}
	) {
		return this.compensationOptimizationService.optimize(
			body.totalAmount,
			body.currentProfit || 0,
			body.isPME ?? true
		);
	}
}

