import { Module } from '@nestjs/common';
import { TaxesService } from './taxes.service';
import { TaxesController } from './taxes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '../config/config.module';
import { TaxDeductionsService } from './tax-deductions.service';
import { TaxDeductionsController } from './tax-deductions.controller';
import { AmortizationsService } from './amortizations.service';
import { AmortizationsController } from './amortizations.controller';
import { TaxCreditsService } from './tax-credits.service';
import { TaxCreditsController } from './tax-credits.controller';
import { TaxSimulationsService } from './tax-simulations.service';
import { TaxSimulationsController } from './tax-simulations.controller';
import { CompensationOptimizationService } from './compensation-optimization.service';
import { CompensationOptimizationController } from './compensation-optimization.controller';

/**
 * Module Taxes
 * 
 * Gère les taxes et impôts :
 * - Taux de TVA (CRUD)
 * - Calcul de l'Impôt sur les Sociétés (IS)
 * - Calcul de la CFE (Cotisation Foncière des Entreprises)
 * - Gestion des déductions fiscales
 * - Gestion des amortissements (linéaire, dégressif)
 * - Gestion des crédits d'impôt (CIR, CII, Formation)
 * - Simulation fiscale (scénarios, comparaisons)
 * - Optimisation de rémunération (salaire vs dividendes)
 * 
 * @see TaxesService pour la logique métier
 * @see TaxesController pour les endpoints API
 */
@Module({
	imports: [PrismaModule, ConfigModule],
	controllers: [
		TaxesController,
		TaxDeductionsController,
		AmortizationsController,
		TaxCreditsController,
		TaxSimulationsController,
		CompensationOptimizationController,
	],
	providers: [
		TaxesService,
		TaxDeductionsService,
		AmortizationsService,
		TaxCreditsService,
		TaxSimulationsService,
		CompensationOptimizationService,
	],
	exports: [
		TaxesService,
		TaxDeductionsService,
		AmortizationsService,
		TaxCreditsService,
		TaxSimulationsService,
		CompensationOptimizationService,
	],
})
export class TaxesModule {}


