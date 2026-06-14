import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BillingModule } from '../billing/billing.module';
import { AccountingService } from './accounting.service';
import { AccountingController } from './accounting.controller';

@Module({
	imports: [PrismaModule, BillingModule],
	controllers: [AccountingController],
	providers: [AccountingService],
	exports: [AccountingService]
})
export class AccountingModule {}


