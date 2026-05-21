import { Module } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { PublicQuotesController, QuotesController } from './quotes.controller';
import { InvoicesModule } from '../invoices/invoices.module';
import { CommonModule } from '../common/common.module';
import { AccountingModule } from '../accounting/accounting.module';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
	imports: [InvoicesModule, CommonModule, AccountingModule, OrganizationsModule],
	controllers: [QuotesController, PublicQuotesController],
	providers: [QuotesService],
	exports: [QuotesService],
})
export class QuotesModule {}


