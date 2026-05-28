import { Module } from '@nestjs/common';
import { RefundsController } from './refunds.controller';
import { RefundsService } from './refunds.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AccountingModule } from '../accounting/accounting.module';
import { AvoirsModule } from '../avoirs/avoirs.module';
import { StripeModule } from '../stripe/stripe.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
	imports: [PrismaModule, AccountingModule, AvoirsModule, StripeModule, RealtimeModule],
	controllers: [RefundsController],
	providers: [RefundsService],
	exports: [RefundsService],
})
export class RefundsModule {}
