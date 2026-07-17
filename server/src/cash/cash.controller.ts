import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FinanceModulePlanGuard } from '../billing/guards/finance-module-plan.guard';
import { CashService } from './cash.service';
import { CreateCashMovementDto, CreateCashRegisterDto } from './dto/cash.dto';

/**
 * API caisse / fond de caisse (plan Pro+ finance).
 */
@UseGuards(FinanceModulePlanGuard)
@Controller('cash')
export class CashController {
	constructor(private readonly cash: CashService) {}

	/**
	 * Liste les caisses.
	 * @param user - Utilisateur authentifié
	 */
	@Get('registers')
	listRegisters(@CurrentUser() user: { organizationId?: number }) {
		return this.cash.listRegisters(user.organizationId);
	}

	/**
	 * Crée une caisse.
	 * @param user - Utilisateur authentifié
	 * @param body - Données
	 */
	@Post('registers')
	createRegister(
		@CurrentUser() user: { organizationId?: number },
		@Body() body: CreateCashRegisterDto,
	) {
		return this.cash.createRegister(user.organizationId, body);
	}

	/**
	 * Détail d'une caisse + mouvements.
	 * @param user - Utilisateur authentifié
	 * @param id - Identifiant
	 */
	@Get('registers/:id')
	getRegister(@CurrentUser() user: { organizationId?: number }, @Param('id') id: string) {
		return this.cash.getRegister(user.organizationId, parseInt(id, 10));
	}

	/**
	 * Ajoute un mouvement de caisse.
	 * @param user - Utilisateur authentifié
	 * @param id - Identifiant caisse
	 * @param body - Mouvement
	 * @param postAccounting - Poster en compta si true
	 */
	@Post('registers/:id/movements')
	addMovement(
		@CurrentUser() user: { organizationId?: number },
		@Param('id') id: string,
		@Body() body: CreateCashMovementDto,
		@Query('postAccounting') postAccounting?: string,
	) {
		return this.cash.addMovement(
			user.organizationId,
			parseInt(id, 10),
			body,
			postAccounting === 'true',
		);
	}
}
