import { Module } from '@nestjs/common';
import { AccountingModule } from '../accounting/accounting.module';
import { BillingModule } from '../billing/billing.module';
import { PrismaModule } from '../prisma/prisma.module';
import { InvestmentsController } from './investments.controller';
import { InvestmentsService } from './investments.service';

/**
 * Module investisseurs / investissements.
 */
@Module({
	imports: [PrismaModule, BillingModule, AccountingModule],
	controllers: [InvestmentsController],
	providers: [InvestmentsService],
	exports: [InvestmentsService],
})
export class InvestmentsModule {}
