import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TreasuryController } from './treasury.controller';
import { TreasuryService } from './treasury.service';

/**
 * Module trésorerie (prévisions cashflow).
 */
@Module({
	imports: [PrismaModule, BillingModule],
	controllers: [TreasuryController],
	providers: [TreasuryService],
	exports: [TreasuryService],
})
export class TreasuryModule {}
