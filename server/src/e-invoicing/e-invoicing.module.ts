import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { ConfigModule } from '../config/config.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EInvoicingComplianceService } from './e-invoicing-compliance.service';
import { EInvoicingController } from './e-invoicing.controller';
import { EInvoicingService } from './e-invoicing.service';
import { FacturXGeneratorService } from './factur-x-generator.service';
import { PaPartnerClient } from './pa-partner.client';

@Module({
	imports: [PrismaModule, BillingModule, ConfigModule],
	controllers: [EInvoicingController],
	providers: [EInvoicingComplianceService, FacturXGeneratorService, PaPartnerClient, EInvoicingService],
	exports: [EInvoicingService, EInvoicingComplianceService],
})
export class EInvoicingModule {}
