import {
	Controller,
	Get,
	Post,
	Body,
	Param,
	UseGuards,
	ParseIntPipe,
	Patch,
} from '@nestjs/common';
import { UrssafService } from './urssaf.service';
import { CalculateContributionDto } from './dto/calculate-contribution.dto';
import { CreateUrssafFilingDto } from './dto/create-urssaf-filing.dto';
import { UpdateOrganizationUrssafDto } from './dto/update-organization-urssaf.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';

/**
 * Controller pour la gestion des cotisations URSSAF
 * 
 * Toutes les routes nécessitent une authentification JWT.
 * L'organizationId est automatiquement injecté depuis le contexte utilisateur.
 * 
 * @see UrssafService pour la logique métier
 * @see docs/api/URSSAF_API.md pour la documentation complète de l'API
 */
@Controller('urssaf')
@UseGuards(JwtAuthGuard)
export class UrssafController {
	constructor(private readonly urssafService: UrssafService) {}

	/**
	 * Calcule la cotisation URSSAF pour une période
	 * 
	 * @param dto - Paramètres de calcul (période, organisation optionnelle)
	 * @param organizationId - ID de l'organisation (injecté automatiquement)
	 * @returns Résultat du calcul avec CA, taux, cotisation, etc.
	 * 
	 * @example
	 * POST /api/urssaf/calculate
	 * {
	 *   "periodStart": "2024-01-01",
	 *   "periodEnd": "2024-01-31"
	 * }
	 */
	@Post('calculate')
	calculate(@Body() dto: CalculateContributionDto, @CurrentOrg() organizationId: number) {
		// Utiliser l'organizationId du contexte si non fourni
		if (!dto.organizationId) {
			dto.organizationId = organizationId;
		}
		return this.urssafService.calculateContribution(dto);
	}

	/**
	 * Crée une déclaration URSSAF pour une période
	 * 
	 * @param dto - Paramètres de création (période, organisation optionnelle)
	 * @param organizationId - ID de l'organisation (injecté automatiquement)
	 * @returns La déclaration créée avec le calcul associé
	 * 
	 * @example
	 * POST /api/urssaf/filing
	 * {
	 *   "period": "2024-M01"
	 * }
	 */
	@Post('filing')
	createFiling(@Body() dto: CreateUrssafFilingDto, @CurrentOrg() organizationId: number) {
		// Utiliser l'organizationId du contexte si non fourni
		if (!dto.organizationId) {
			dto.organizationId = organizationId;
		}
		return this.urssafService.createUrssafFiling(dto);
	}

	/**
	 * Récupère l'historique des cotisations URSSAF
	 * 
	 * @param organizationId - ID de l'organisation (injecté automatiquement)
	 * @returns Liste des déclarations URSSAF triées par date décroissante
	 * 
	 * @example
	 * GET /api/urssaf/contributions
	 */
	@Get('contributions')
	getContributions(@CurrentOrg() organizationId: number) {
		return this.urssafService.getContributionsHistory(organizationId);
	}

	/**
	 * Estime le CA annuel basé sur une période
	 * 
	 * @param body - Dates de début et fin de période
	 * @param organizationId - ID de l'organisation (injecté automatiquement)
	 * @returns CA annuel estimé (en euros)
	 * 
	 * @example
	 * GET /api/urssaf/estimate-annual-ca
	 * Body: { "periodStart": "2024-01-01", "periodEnd": "2024-01-31" }
	 */
	@Get('estimate-annual-ca')
	async estimateAnnualCA(
		@Body() body: { periodStart: string; periodEnd: string },
		@CurrentOrg() organizationId: number
	) {
		return this.urssafService.estimateAnnualCA(
			organizationId,
			new Date(body.periodStart),
			new Date(body.periodEnd)
		);
	}

	/**
	 * Met à jour la configuration URSSAF de l'organisation
	 * 
	 * @param dto - Données de mise à jour (tous les champs optionnels)
	 * @param organizationId - ID de l'organisation (injecté automatiquement)
	 * @returns L'organisation mise à jour
	 * 
	 * @example
	 * PATCH /api/urssaf/organization
	 * {
	 *   "urssafActivity": "SERVICE_BIC",
	 *   "urssafFiscalOption": true
	 * }
	 */
	@Patch('organization')
	updateOrganizationUrssaf(
		@Body() dto: UpdateOrganizationUrssafDto,
		@CurrentOrg() organizationId: number
	) {
		return this.urssafService.updateOrganizationUrssaf(organizationId, dto);
	}
}

