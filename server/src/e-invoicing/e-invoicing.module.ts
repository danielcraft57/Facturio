import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EInvoicingComplianceService } from './e-invoicing-compliance.service';
import { EInvoicingController } from './e-invoicing.controller';
import { EInvoicingService } from './e-invoicing.service';
import { FacturXGeneratorService } from './factur-x-generator.service';

@Module({
	imports: [PrismaModule, BillingModule],
	controllers: [EInvoicingController],
	providers: [EInvoicingComplianceService, FacturXGeneratorService, EInvoicingService],
	exports: [EInvoicingService, EInvoicingComplianceService],
})
export class EInvoicingModule {}
