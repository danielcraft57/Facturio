import {
	Controller,
	Get,
	Post,
	Body,
	Param,
	Delete,
	Query,
} from '@nestjs/common';
import { AmortizationsService } from './amortizations.service';
import { CreateAmortizationDto } from './dto/create-amortization.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * Controller pour la gestion des amortissements
 *
 * @see AmortizationsService pour la logique métier
 */
@Controller('taxes/amortizations')
export class AmortizationsController {
	constructor(private readonly amortizationsService: AmortizationsService) {}

	/**
	 * Crée un nouvel amortissement
	 */
	@Post()
	create(@CurrentUser() user: any, @Body() data: CreateAmortizationDto) {
		const organizationId = user.organizationId || user.organization?.id;
		return this.amortizationsService.create(organizationId, data);
	}

	/**
	 * Liste les amortissements
	 * Utilise une route spécifique pour éviter les conflits avec @Get(':id')
	 */
	@Get('list')
	findAll(@CurrentUser() user: any, @Query('year') year?: string) {
		const organizationId = user.organizationId || user.organization?.id;
		return this.amortizationsService.findAll(
			organizationId,
			year ? parseInt(year, 10) : undefined
		);
	}

	/**
	 * Calcule le total des amortissements pour une année
	 */
	@Get('totals/:year')
	getTotalAmortizations(@CurrentUser() user: any, @Param('year') year: string) {
		const organizationId = user.organizationId || user.organization?.id;
		return this.amortizationsService.getTotalAmortizations(organizationId, parseInt(year, 10));
	}

	/**
	 * Comptabilise toutes les dotations de l'année (écritures 681/281).
	 * @param user - Utilisateur authentifié
	 * @param year - Année fiscale
	 */
	@Post('post-year/:year')
	postAllYear(@CurrentUser() user: any, @Param('year') year: string) {
		const organizationId = user.organizationId || user.organization?.id;
		return this.amortizationsService.postAllYearToAccounting(
			organizationId,
			parseInt(year, 10),
		);
	}

	/**
	 * Comptabilise la dotation d'un bien pour une année.
	 * @param user - Utilisateur authentifié
	 * @param id - Identifiant amortissement
	 * @param year - Année fiscale
	 */
	@Post(':id/post/:year')
	postOneYear(
		@CurrentUser() user: any,
		@Param('id') id: string,
		@Param('year') year: string,
	) {
		const organizationId = user.organizationId || user.organization?.id;
		return this.amortizationsService.postYearToAccounting(
			organizationId,
			parseInt(id, 10),
			parseInt(year, 10),
		);
	}

	/**
	 * Récupère un amortissement par ID
	 */
	@Get(':id')
	findOne(@CurrentUser() user: any, @Param('id') id: string) {
		const organizationId = user.organizationId || user.organization?.id;
		return this.amortizationsService.findOne(organizationId, parseInt(id, 10));
	}

	/**
	 * Supprime un amortissement
	 */
	@Delete(':id')
	remove(@CurrentUser() user: any, @Param('id') id: string) {
		const organizationId = user.organizationId || user.organization?.id;
		return this.amortizationsService.remove(organizationId, parseInt(id, 10));
	}
}
