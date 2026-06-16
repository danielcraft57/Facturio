import { Module } from '@nestjs/common';
import { FilingsService } from './filings.service';
import { FilingsController } from './filings.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BillingModule } from '../billing/billing.module';

@Module({
	imports: [PrismaModule, BillingModule],
	controllers: [FilingsController],
	providers: [FilingsService],
	exports: [FilingsService]
})
export class FilingsModule {}


