import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoiceSendService } from './invoice-send.service';
import { InvoicesController, PublicInvoicesController } from './invoices.controller';
import { CommonModule } from '../common/common.module';
import { AccountingModule } from '../accounting/accounting.module';
import { ConfigModule } from '../config/config.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { StripeModule } from '../stripe/stripe.module';
import { BillingModule } from '../billing/billing.module';
import { InvoicePaymentNotificationModule } from './invoice-payment-notification.module';

@Module({
	imports: [
		CommonModule,
		AccountingModule,
		ConfigModule,
		OrganizationsModule,
		StripeModule,
		BillingModule,
		InvoicePaymentNotificationModule,
	],
	controllers: [InvoicesController, PublicInvoicesController],
	providers: [InvoicesService, InvoiceSendService],
	exports: [InvoicesService, InvoiceSendService],
})
export class InvoicesModule {}


