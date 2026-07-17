import { Module } from '@nestjs/common';
import { AccountingModule } from '../accounting/accounting.module';
import { BillingModule } from '../billing/billing.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CashController } from './cash.controller';
import { CashService } from './cash.service';

/**
 * Module caisse espèces.
 */
@Module({
	imports: [PrismaModule, BillingModule, AccountingModule],
	controllers: [CashController],
	providers: [CashService],
	exports: [CashService],
})
export class CashModule {}
