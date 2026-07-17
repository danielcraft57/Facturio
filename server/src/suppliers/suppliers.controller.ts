import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FinanceModulePlanGuard } from '../billing/guards/finance-module-plan.guard';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SuppliersService } from './suppliers.service';

/**
 * API référentiel fournisseurs (plan Pro+).
 */
@UseGuards(FinanceModulePlanGuard)
@Controller('suppliers')
export class SuppliersController {
	constructor(private readonly suppliers: SuppliersService) {}

	/**
	 * Liste les fournisseurs.
	 * @param user - Utilisateur authentifié
	 * @param active - Filtre actifs uniquement si "true"
	 */
	@Get()
	findAll(
		@CurrentUser() user: { organizationId?: number },
		@Query('active') active?: string,
	) {
		return this.suppliers.findAll(user.organizationId, active === 'true');
	}

	/**
	 * Détail d'un fournisseur.
	 * @param user - Utilisateur authentifié
	 * @param id - Identifiant
	 */
	@Get(':id')
	findOne(@CurrentUser() user: { organizationId?: number }, @Param('id') id: string) {
		return this.suppliers.findOne(user.organizationId, parseInt(id, 10));
	}

	/**
	 * Crée un fournisseur.
	 * @param user - Utilisateur authentifié
	 * @param body - Données
	 */
	@Post()
	create(@CurrentUser() user: { organizationId?: number }, @Body() body: CreateSupplierDto) {
		return this.suppliers.create(user.organizationId, body);
	}

	/**
	 * Met à jour un fournisseur.
	 * @param user - Utilisateur authentifié
	 * @param id - Identifiant
	 * @param body - Champs
	 */
	@Patch(':id')
	update(
		@CurrentUser() user: { organizationId?: number },
		@Param('id') id: string,
		@Body() body: UpdateSupplierDto,
	) {
		return this.suppliers.update(user.organizationId, parseInt(id, 10), body);
	}

	/**
	 * Désactive un fournisseur.
	 * @param user - Utilisateur authentifié
	 * @param id - Identifiant
	 */
	@Post(':id/deactivate')
	deactivate(@CurrentUser() user: { organizationId?: number }, @Param('id') id: string) {
		return this.suppliers.deactivate(user.organizationId, parseInt(id, 10));
	}

	/**
	 * Crée / récupère le créancier lié pour ouvrir une dette.
	 * @param user - Utilisateur authentifié
	 * @param id - Identifiant fournisseur
	 */
	@Post(':id/link-creditor')
	linkCreditor(@CurrentUser() user: { organizationId?: number }, @Param('id') id: string) {
		return this.suppliers.linkAsCreditor(user.organizationId, parseInt(id, 10));
	}
}
