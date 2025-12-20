import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ClientsModule } from './clients/clients.module';
import { InvoicesModule } from './invoices/invoices.module';
import { TaxesModule } from './taxes/taxes.module';
import { ProductsModule } from './products/products.module';
import { QuotesModule } from './quotes/quotes.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { FilingsModule } from './filings/filings.module';
import { WebhooksController } from './webhooks.controller';
import { AccountingModule } from './accounting/accounting.module';
import { CommonModule } from './common/common.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PaymentsModule } from './payments/payments.module';
import { ProspectsModule } from './prospects/prospects.module';
import { PacksModule } from './packs/packs.module';
import { ConfigModule } from './config/config.module';

@Module({
	imports: [
		ConfigModule,
		PrismaModule,
		CommonModule,
		ClientsModule,
		InvoicesModule,
		TaxesModule,
		ProductsModule,
		QuotesModule,
		SubscriptionsModule,
		FilingsModule,
		AccountingModule,
		DashboardModule,
		PaymentsModule,
		ProspectsModule,
		PacksModule
	],
	controllers: [WebhooksController],
	providers: []
})
export class AppModule {}
