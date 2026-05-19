import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { PlatformStripeService } from './platform-stripe.service';
import { ConfigModule } from '../config/config.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
	imports: [ConfigModule, PrismaModule],
	controllers: [BillingController],
	providers: [BillingService, PlatformStripeService],
	exports: [BillingService, PlatformStripeService],
})
export class BillingModule {}
