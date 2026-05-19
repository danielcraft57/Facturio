import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripePublicController } from './stripe-public.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentsModule } from '../payments/payments.module';
@Module({
	imports: [PrismaModule, PaymentsModule],
	controllers: [StripePublicController],
	providers: [StripeService],
	exports: [StripeService]
})
export class StripeModule {}
