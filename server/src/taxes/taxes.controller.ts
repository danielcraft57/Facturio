import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { CreateTaxDto, TaxesService, UpdateTaxDto } from './taxes.service';
import { CalculateIsDto } from './dto/calculate-is.dto';
import { CalculateCfeDto } from './dto/calculate-cfe.dto';

/**
 * Controller pour la gestion des taxes et impôts
 * 
 * Gère :
 * - Les taux de TVA (CRUD)
 * - Le calcul de l'Impôt sur les Sociétés (IS)
 * - Le calcul de la CFE (Cotisation Foncière des Entreprises)
 * 
 * @see TaxesService pour la logique métier
 */
@Controller('taxes')
export class TaxesController {
	constructor(private readonly taxes: TaxesService) {}

	@Post()
	create(@Body() data: CreateTaxDto) {
		return this.taxes.create(data);
	}

	@Get()
	findAll(@Query() query: { search?: string; isDefault?: string }) {
		return this.taxes.findAll({
			search: query.search,
			isDefault: query.isDefault === 'true' ? true : query.isDefault === 'false' ? false : undefined
		});
	}

	@Get(':id')
	findOne(@Param('id', ParseIntPipe) id: number) {
		return this.taxes.findOne(id);
	}

	@Patch(':id')
	update(
		@Param('id', ParseIntPipe) id: number,
		@Body() data: UpdateTaxDto
	) {
		return this.taxes.update(id, data);
	}

	@Delete(':id')
	remove(@Param('id', ParseIntPipe) id: number) {
		return this.taxes.remove(id);
	}

	/**
	 * Calcule l'Impôt sur les Sociétés (IS)
	 * 
	 * @param dto - Paramètres de calcul (année, revenus, charges, etc.)
	 * @returns Résultat du calcul avec détail par tranche
	 * 
	 * @example
	 * POST /api/taxes/calculate-is
	 * {
	 *   "year": 2024,
	 *   "revenue": 100000,
	 *   "expenses": 60000,
	 *   "isPME": true,
	 *   "capitalHeldByIndividuals": 80
	 * }
	 */
	@Post('calculate-is')
	calculateIS(@Body() dto: CalculateIsDto) {
		return this.taxes.calculateIS(dto);
	}

	/**
	 * Calcule la CFE (Cotisation Foncière des Entreprises)
	 * 
	 * @param dto - Paramètres de calcul (année, valeur locative, activité, etc.)
	 * @returns Résultat du calcul de la CFE
	 * 
	 * @example
	 * POST /api/taxes/calculate-cfe
	 * {
	 *   "year": 2024,
	 *   "propertyValue": 50000,
	 *   "activity": "SERVICE"
	 * }
	 */
	@Post('calculate-cfe')
	calculateCFE(@Body() dto: CalculateCfeDto) {
		return this.taxes.calculateCFE(dto);
	}
}


