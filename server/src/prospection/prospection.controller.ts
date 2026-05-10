import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ProspectionService } from './prospection.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateProspectionConfigDto } from './dto/update-prospection-config.dto';

@Controller('prospection')
export class ProspectionController {
	constructor(private readonly prospection: ProspectionService) {}

	/**
	 * Configuration ProspectLab (clé API installée ou non).
	 * Permet au front d’afficher le lien vers la création de token.
	 */
	@Get('config')
	getConfig(@CurrentUser() user: any) {
		return this.prospection.getConfig(user.organizationId);
	}

	@Patch('config')
	updateConfig(@Body() body: UpdateProspectionConfigDto, @CurrentUser() user: any) {
		return this.prospection.updateConfig(user.organizationId, body);
	}

	/**
	 * Liste des prospects issus de ProspectLab.
	 * Format identique à GET /api/prospects pour réutilisation du même tableau.
	 */
	@Get()
	async getProspects(
		@Query('page') page?: string,
		@Query('pageSize') pageSize?: string,
		@Query('search') search?: string,
		@Query('secteur') secteur?: string,
		@Query('statut') statut?: string,
		@CurrentUser() user?: any
	) {
		const p = page ? parseInt(page, 10) : 1;
		const ps = pageSize ? parseInt(pageSize, 10) : 20;
		return this.prospection.getProspects(p, ps, search, secteur, statut, user?.organizationId);
	}

	// ==========================
	// Proxy "API publique" ProspectLab
	// ==========================

	@Get('entreprises')
	listEntreprises(
		@Query('limit') limit?: string,
		@Query('offset') offset?: string,
		@Query('secteur') secteur?: string,
		@Query('statut') statut?: string,
		@Query('search') search?: string,
		@CurrentUser() user?: any
	) {
		return this.prospection.listEntreprises({
			limit: limit ? parseInt(limit, 10) : undefined,
			offset: offset ? parseInt(offset, 10) : undefined,
			secteur,
			statut,
			search
		}, user?.organizationId);
	}

	@Get('entreprises/:id')
	getEntreprise(@Param('id') id: string, @CurrentUser() user?: any) {
		return this.prospection.getEntreprise(id, user?.organizationId);
	}

	@Get('entreprises/:id/emails')
	getEntrepriseEmails(@Param('id') id: string, @CurrentUser() user?: any) {
		return this.prospection.getEntrepriseEmails(id, user?.organizationId);
	}

	@Get('emails')
	listEmails(
		@Query('limit') limit?: string,
		@Query('offset') offset?: string,
		@Query('entreprise_id') entrepriseId?: string,
		@CurrentUser() user?: any
	) {
		return this.prospection.listEmails({
			limit: limit ? parseInt(limit, 10) : undefined,
			offset: offset ? parseInt(offset, 10) : undefined,
			entreprise_id: entrepriseId ?? undefined
		}, user?.organizationId);
	}

	@Get('statistics')
	getStatistics(@CurrentUser() user?: any) {
		return this.prospection.getStatistics(user?.organizationId);
	}

	@Get('campagnes')
	listCampagnes(
		@Query('limit') limit?: string,
		@Query('offset') offset?: string,
		@Query('statut') statut?: string,
		@CurrentUser() user?: any
	) {
		return this.prospection.listCampagnes({
			limit: limit ? parseInt(limit, 10) : undefined,
			offset: offset ? parseInt(offset, 10) : undefined,
			statut
		}, user?.organizationId);
	}

	@Get('campagnes/:id')
	getCampagne(@Param('id') id: string, @CurrentUser() user?: any) {
		return this.prospection.getCampagne(id, user?.organizationId);
	}

	@Get('campagnes/:id/emails')
	getCampagneEmails(
		@Param('id') id: string,
		@Query('limit') limit?: string,
		@Query('offset') offset?: string,
		@Query('statut') statut?: string,
		@CurrentUser() user?: any
	) {
		return this.prospection.getCampagneEmails(id, {
			limit: limit ? parseInt(limit, 10) : undefined,
			offset: offset ? parseInt(offset, 10) : undefined,
			statut
		}, user?.organizationId);
	}

	@Get('campagnes/:id/statistics')
	getCampagneStatistics(@Param('id') id: string, @CurrentUser() user?: any) {
		return this.prospection.getCampagneStatistics(id, user?.organizationId);
	}
}
