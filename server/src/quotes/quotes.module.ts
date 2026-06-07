import { Module } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { QuoteSendService } from './quote-send.service';
import { PublicQuotesController, QuotesController } from './quotes.controller';
import { InvoicesModule } from '../invoices/invoices.module';
import { CommonModule } from '../common/common.module';
import { AccountingModule } from '../accounting/accounting.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { ProductsModule } from '../products/products.module';

@Module({
	imports: [InvoicesModule, CommonModule, AccountingModule, OrganizationsModule, ProductsModule],
	controllers: [QuotesController, PublicQuotesController],
	providers: [QuotesService, QuoteSendService],
	exports: [QuotesService, QuoteSendService],
})
export class QuotesModule {}


