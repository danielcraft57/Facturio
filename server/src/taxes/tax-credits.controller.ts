import {
	Controller,
	Get,
	Post,
	Body,
	Param,
	Patch,
	Query,
	UseGuards,
} from '@nestjs/common';
import { TaxCreditsService } from './tax-credits.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * Controller pour la gestion des crédits d'impôt
 * 
 * @see TaxCreditsService pour la logique métier
 */
@Controller('taxes/credits')
@UseGuards(JwtAuthGuard)
export class TaxCreditsController {
	constructor(private readonly taxCreditsService: TaxCreditsService) {}

	/**
	 * Calcule les crédits d'impôt éligibles
	 */
	@Post('calculate')
	calculateEligible(
		@CurrentUser() user: any,
		@Body()
		body: {
			year: number;
			expenses?: { rnd?: number; innovation?: number; formation?: number; apprenticeship?: number };
		}
	) {
		const organizationId = user.organizationId || user.organization?.id;
		return this.taxCreditsService.calculateEligibleCredits(organizationId, body.year, body.expenses);
	}

	/**
	 * Crée un crédit d'impôt
	 */
	@Post()
	create(
		@CurrentUser() user: any,
		@Body()
		data: {
			type: 'CIR' | 'CII' | 'FORMATION' | 'APPRENTICESHIP' | 'OTHER';
			name: string;
			description?: string;
			eligibleAmount: number;
			rate?: number;
			year: number;
			documents?: number[];
			notes?: string;
		}
	) {
		const organizationId = user.organizationId || user.organization?.id;
		return this.taxCreditsService.create(organizationId, data);
	}

	/**
	 * Liste les crédits d'impôt
	 */
	@Get()
	findAll(@CurrentUser() user: any, @Query('year') year?: string) {
		const organizationId = user.organizationId || user.organization?.id;
		return this.taxCreditsService.findAll(organizationId, year ? parseInt(year, 10) : undefined);
	}

	/**
	 * Récupère un crédit d'impôt par ID
	 */
	@Get(':id')
	findOne(@CurrentUser() user: any, @Param('id') id: string) {
		const organizationId = user.organizationId || user.organization?.id;
		return this.taxCreditsService.findOne(organizationId, parseInt(id, 10));
	}

	/**
	 * Calcule le total des crédits d'impôt pour une année
	 */
	@Get('totals/:year')
	getTotalCredits(@CurrentUser() user: any, @Param('year') year: string) {
		const organizationId = user.organizationId || user.organization?.id;
		return this.taxCreditsService.getTotalCredits(organizationId, parseInt(year, 10));
	}

	/**
	 * Marque un crédit d'impôt comme réclamé
	 */
	@Patch(':id/claim')
	claim(@CurrentUser() user: any, @Param('id') id: string) {
		const organizationId = user.organizationId || user.organization?.id;
		return this.taxCreditsService.claim(organizationId, parseInt(id, 10));
	}
}

