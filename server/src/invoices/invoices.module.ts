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
import { RefundsModule } from '../refunds/refunds.module';
import { AvoirsModule } from '../avoirs/avoirs.module';
import { InvoiceInstallmentsModule } from './invoice-installments.module';
import { InvoiceInstallmentReminderService } from './invoice-installment-reminder.service';

@Module({
	imports: [
		CommonModule,
		AccountingModule,
		ConfigModule,
		OrganizationsModule,
		StripeModule,
		BillingModule,
		InvoicePaymentNotificationModule,
		RefundsModule,
		AvoirsModule,
		InvoiceInstallmentsModule,
	],
	controllers: [InvoicesController, PublicInvoicesController],
	providers: [InvoicesService, InvoiceSendService, InvoiceInstallmentReminderService],
	exports: [InvoicesService, InvoiceSendService, InvoiceInstallmentsModule],
})
export class InvoicesModule {}


