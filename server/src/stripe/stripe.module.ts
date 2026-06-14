import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripePublicController } from './stripe-public.controller';
import { StripeUnifiedWebhookService } from './stripe-unified-webhook.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentsModule } from '../payments/payments.module';
import { BillingModule } from '../billing/billing.module';
import { ConfigModule } from '../config/config.module';
import { InvoiceInstallmentsModule } from '../invoices/invoice-installments.module';

@Module({
	imports: [PrismaModule, PaymentsModule, BillingModule, ConfigModule, InvoiceInstallmentsModule],
	controllers: [StripePublicController],
	providers: [StripeService, StripeUnifiedWebhookService],
	exports: [StripeService, StripeUnifiedWebhookService],
})
export class StripeModule {}
