import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RateLimitMiddleware, RateLimitService } from './common/rate-limit.middleware';
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
import { ProspectionModule } from './prospection/prospection.module';
import { PacksModule } from './packs/packs.module';
import { AvoirsModule } from './avoirs/avoirs.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { UrssafModule } from './urssaf/urssaf.module';
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
		ProspectionModule,
		PacksModule,
		AvoirsModule,
		AuthModule,
		UsersModule,
		OrganizationsModule,
		UrssafModule
	],
	controllers: [WebhooksController],
	providers: [
		{ provide: APP_GUARD, useClass: JwtAuthGuard },
		RateLimitService,
	]
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer
			.apply(RateLimitMiddleware)
			.forRoutes('auth/login', 'auth/signup', 'auth/forgot-password');
	}
}
