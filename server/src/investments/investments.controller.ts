import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AccountingPlanGuard } from '../billing/guards/accounting-plan.guard';
import { CreateInvestmentDto, CreateInvestorDto } from './dto/investments.dto';
import { InvestmentsService } from './investments.service';

/**
 * API investisseurs et investissements (plan Pro+ compta).
 */
@UseGuards(AccountingPlanGuard)
@Controller('investments')
export class InvestmentsController {
	constructor(private readonly investments: InvestmentsService) {}

	/**
	 * Synthèse des montants actifs.
	 * @param user - Utilisateur authentifié
	 */
	@Get('summary')
	summary(@CurrentUser() user: { organizationId?: number }) {
		return this.investments.getSummary(user.organizationId);
	}

	/**
	 * Liste les investisseurs.
	 * @param user - Utilisateur authentifié
	 */
	@Get('investors')
	listInvestors(@CurrentUser() user: { organizationId?: number }) {
		return this.investments.listInvestors(user.organizationId);
	}

	/**
	 * Crée un investisseur.
	 * @param user - Utilisateur authentifié
	 * @param body - Données
	 */
	@Post('investors')
	createInvestor(
		@CurrentUser() user: { organizationId?: number },
		@Body() body: CreateInvestorDto,
	) {
		return this.investments.createInvestor(user.organizationId, body);
	}

	/**
	 * Liste les investissements.
	 * @param user - Utilisateur authentifié
	 */
	@Get()
	list(@CurrentUser() user: { organizationId?: number }) {
		return this.investments.listInvestments(user.organizationId);
	}

	/**
	 * Crée un investissement.
	 * @param user - Utilisateur authentifié
	 * @param body - Données
	 */
	@Post()
	create(@CurrentUser() user: { organizationId?: number }, @Body() body: CreateInvestmentDto) {
		return this.investments.createInvestment(user.organizationId, body);
	}

	/**
	 * Clôture un investissement.
	 * @param user - Utilisateur authentifié
	 * @param id - Identifiant
	 */
	@Post(':id/close')
	close(@CurrentUser() user: { organizationId?: number }, @Param('id') id: string) {
		return this.investments.closeInvestment(user.organizationId, parseInt(id, 10));
	}
}
