import { Module } from '@nestjs/common';
import { FilingsService } from './filings.service';
import { FilingsController } from './filings.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BillingModule } from '../billing/billing.module';
import { TaxesModule } from '../taxes/taxes.module';
import { OrgFiscalSnapshotService } from './calculators/org-fiscal-snapshot.service';
import { VatFilingCalculator } from './calculators/vat-filing.calculator';
import { IsFilingCalculator } from './calculators/is-filing.calculator';
import { CfeFilingCalculator } from './calculators/cfe-filing.calculator';
import { FilingCalculatorRegistry } from './calculators/filing-calculator.registry';

/**
 * Module déclarations fiscales.
 * Calculateurs pluggables : TVA, IS, CFE (URSSAF = module dédié).
 */
@Module({
	imports: [PrismaModule, BillingModule, TaxesModule],
	controllers: [FilingsController],
	providers: [
		FilingsService,
		OrgFiscalSnapshotService,
		VatFilingCalculator,
		IsFilingCalculator,
		CfeFilingCalculator,
		FilingCalculatorRegistry,
	],
	exports: [FilingsService, OrgFiscalSnapshotService],
})
export class FilingsModule {}
