import {
	Controller,
	Get,
	Post,
	Body,
	Param,
	Query,
} from '@nestjs/common';
import { TaxSimulationsService } from './tax-simulations.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * Controller pour les simulations fiscales
 *
 * @see TaxSimulationsService pour la logique métier
 */
@Controller('taxes/simulations')
export class TaxSimulationsController {
	constructor(private readonly taxSimulationsService: TaxSimulationsService) {}

	/**
	 * Simule un scénario fiscal
	 */
	@Post()
	simulate(
		@CurrentUser() user: any,
		@Body()
		body: {
			year: number;
			scenario?: 'CURRENT' | 'OPTIMIZED' | 'CUSTOM';
			customData?: {
				revenue?: number;
				expenses?: number;
				deductions?: number;
				amortizations?: number;
				credits?: number;
			};
		}
	) {
		const organizationId = user.organizationId || user.organization?.id;
		return this.taxSimulationsService.simulate(
			organizationId,
			body.year,
			body.scenario || 'CURRENT',
			body.customData
		);
	}

	/**
	 * Compare deux scénarios fiscaux
	 */
	@Post('compare')
	compare(
		@CurrentUser() user: any,
		@Body() body: { year: number }
	) {
		const organizationId = user.organizationId || user.organization?.id;
		return this.taxSimulationsService.compareScenarios(organizationId, body.year);
	}

	/**
	 * Liste les simulations sauvegardées
	 */
	@Get()
	findAll(@CurrentUser() user: any, @Query('year') year?: string) {
		const organizationId = user.organizationId || user.organization?.id;
		return this.taxSimulationsService.findAll(
			organizationId,
			year ? parseInt(year, 10) : undefined
		);
	}
}

