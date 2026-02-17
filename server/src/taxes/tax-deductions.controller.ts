import {
	Controller,
	Get,
	Post,
	Body,
	Param,
	Patch,
	Delete,
	Query,
} from '@nestjs/common';
import { TaxDeductionsService } from './tax-deductions.service';
import { CreateTaxDeductionDto } from './dto/create-tax-deduction.dto';
import { UpdateTaxDeductionDto } from './dto/update-tax-deduction.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * Controller pour la gestion des déductions fiscales
 *
 * @see TaxDeductionsService pour la logique métier
 */
@Controller('taxes/deductions')
export class TaxDeductionsController {
	constructor(private readonly taxDeductionsService: TaxDeductionsService) {}

	/**
	 * Crée une nouvelle déduction fiscale
	 */
	@Post()
	create(@CurrentUser() user: any, @Body() data: CreateTaxDeductionDto) {
		const organizationId = user.organizationId || user.organization?.id;
		return this.taxDeductionsService.create(organizationId, data);
	}

	/**
	 * Liste les déductions fiscales
	 * Utilise une route spécifique pour éviter les conflits avec @Get(':id')
	 */
	@Get('list')
	findAll(
		@CurrentUser() user: any,
		@Query() query: any,
	) {
		const organizationId = user.organizationId || user.organization?.id;
		// Transformer les query params manuellement
		const parsedQuery: any = {};
		if (query?.page) parsedQuery.page = parseInt(query.page, 10);
		if (query?.pageSize) parsedQuery.pageSize = parseInt(query.pageSize, 10);
		if (query?.year) parsedQuery.year = parseInt(query.year, 10);
		if (query?.category) parsedQuery.category = query.category;
		if (query?.status) parsedQuery.status = query.status;
		if (query?.search) parsedQuery.search = query.search;
		if (query?.sortBy) parsedQuery.sortBy = query.sortBy;
		if (query?.order) parsedQuery.order = query.order;
		return this.taxDeductionsService.findAll(organizationId, Object.keys(parsedQuery).length > 0 ? parsedQuery : undefined);
	}

	/**
	 * Calcule le total des déductions pour une année
	 */
	@Get('totals/:year')
	getTotalDeductions(@CurrentUser() user: any, @Param('year') year: string) {
		const organizationId = user.organizationId || user.organization?.id;
		return this.taxDeductionsService.getTotalDeductions(organizationId, parseInt(year, 10));
	}

	/**
	 * Récupère une déduction fiscale par ID
	 */
	@Get(':id')
	findOne(@CurrentUser() user: any, @Param('id') id: string) {
		const organizationId = user.organizationId || user.organization?.id;
		return this.taxDeductionsService.findOne(organizationId, parseInt(id, 10));
	}

	/**
	 * Met à jour une déduction fiscale
	 */
	@Patch(':id')
	update(
		@CurrentUser() user: any,
		@Param('id') id: string,
		@Body() data: UpdateTaxDeductionDto
	) {
		const organizationId = user.organizationId || user.organization?.id;
		return this.taxDeductionsService.update(organizationId, parseInt(id, 10), data);
	}

	/**
	 * Supprime une déduction fiscale
	 */
	@Delete(':id')
	remove(@CurrentUser() user: any, @Param('id') id: string) {
		const organizationId = user.organizationId || user.organization?.id;
		return this.taxDeductionsService.remove(organizationId, parseInt(id, 10));
	}

	/**
	 * Valide une déduction fiscale
	 */
	@Patch(':id/validate')
	validate(@CurrentUser() user: any, @Param('id') id: string) {
		const organizationId = user.organizationId || user.organization?.id;
		return this.taxDeductionsService.validate(organizationId, parseInt(id, 10));
	}

	/**
	 * Rejette une déduction fiscale
	 */
	@Patch(':id/reject')
	reject(
		@CurrentUser() user: any,
		@Param('id') id: string,
		@Body() body: { reason?: string }
	) {
		const organizationId = user.organizationId || user.organization?.id;
		return this.taxDeductionsService.reject(organizationId, parseInt(id, 10), body.reason);
	}
}
