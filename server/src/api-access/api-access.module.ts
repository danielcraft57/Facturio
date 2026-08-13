import { Module } from '@nestjs/common';
import { ApiAccessTokenService } from './api-access-token.service';
import { ApiAccessTokenController } from './api-access-token.controller';
import { PublicApiController } from './public-api.controller';
import { ApiBearerGuard } from './guards/api-bearer.guard';
import { PublicApiDispatchService } from './public-api-dispatch.service';
import { ClientsModule } from '../clients/clients.module';
import { ProductsModule } from '../products/products.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { QuotesModule } from '../quotes/quotes.module';
import { CommonModule } from '../common/common.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { BillingModule } from '../billing/billing.module';
import { RefundsModule } from '../refunds/refunds.module';
import { StripeModule } from '../stripe/stripe.module';

@Module({
	imports: [
		ClientsModule,
		ProductsModule,
		InvoicesModule,
		QuotesModule,
		CommonModule,
		OrganizationsModule,
		BillingModule,
		RefundsModule,
		StripeModule,
	],
	controllers: [ApiAccessTokenController, PublicApiController],
	providers: [ApiAccessTokenService, ApiBearerGuard, PublicApiDispatchService],
	exports: [ApiAccessTokenService],
})
export class ApiAccessModule {}
