import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from './auth/guards/email-verified.guard';
import { DemoWriteGuard } from './demo/guards/demo-write.guard';
import { RateLimitMiddleware, RateLimitService } from './common/rate-limit.middleware';
import { PublicAccessRateLimitMiddleware } from './common/public-access-rate-limit.middleware';
import { ClientsModule } from './clients/clients.module';
import { InvoicesModule } from './invoices/invoices.module';
import { TaxesModule } from './taxes/taxes.module';
import { ProductsModule } from './products/products.module';
import { CatalogModule } from './catalog/catalog.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { QuotesModule } from './quotes/quotes.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { FilingsModule } from './filings/filings.module';
import { WebhooksController } from './webhooks.controller';
import { AccountingModule } from './accounting/accounting.module';
import { CommonModule } from './common/common.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PaymentsModule } from './payments/payments.module';
import { PacksModule } from './packs/packs.module';
import { AvoirsModule } from './avoirs/avoirs.module';
import { RefundsModule } from './refunds/refunds.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { UrssafModule } from './urssaf/urssaf.module';
import { ConfigModule } from './config/config.module';
import { StripeModule } from './stripe/stripe.module';
import { BillingModule } from './billing/billing.module';
import { SecretsCryptoModule } from './crypto/secrets-crypto.module';
import { GdprModule } from './gdpr/gdpr.module';
import { EInvoicingModule } from './e-invoicing/e-invoicing.module';
import { ApiAccessModule } from './api-access/api-access.module';
import { RealtimeModule } from './realtime/realtime.module';
import { MobileNotificationsModule } from './mobile-notifications/mobile-notifications.module';
import { ReceivablesModule } from './receivables/receivables.module';
import { PayablesModule } from './payables/payables.module';
import { DemoModule } from './demo/demo.module';
import { SecurityHeadersMiddleware } from './common/security-headers.middleware';

@Module({
	imports: [
		ConfigModule,
		SecretsCryptoModule,
		GdprModule,
		EInvoicingModule,
		StripeModule,
		BillingModule,
		PrismaModule,
		CommonModule,
		ClientsModule,
		InvoicesModule,
		TaxesModule,
		ProductsModule,
		CatalogModule,
		OnboardingModule,
		QuotesModule,
		SubscriptionsModule,
		FilingsModule,
		AccountingModule,
		DashboardModule,
		PaymentsModule,
		PacksModule,
		AvoirsModule,
		RefundsModule,
		AuthModule,
		UsersModule,
		OrganizationsModule,
		UrssafModule,
		ApiAccessModule,
		RealtimeModule,
		MobileNotificationsModule,
		ReceivablesModule,
		PayablesModule,
		DemoModule,
	],
	controllers: [WebhooksController],
	providers: [
		{ provide: APP_GUARD, useClass: JwtAuthGuard },
		{ provide: APP_GUARD, useClass: EmailVerifiedGuard },
		{ provide: APP_GUARD, useClass: DemoWriteGuard },
		RateLimitService,
		PublicAccessRateLimitMiddleware,
	]
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(SecurityHeadersMiddleware).forRoutes('*');
		consumer
			.apply(RateLimitMiddleware)
			.forRoutes('auth/login', 'auth/signup', 'auth/forgot-password', 'demo/enter');
		consumer
			.apply(PublicAccessRateLimitMiddleware)
			.forRoutes(
				'public/invoices',
				'public/quotes',
				'public/clients',
				'public/produits',
				'public/factures',
				'public/devis',
				'public/dettes',
			);
	}
}
