import { Module } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { PublicQuotesController, QuotesController } from './quotes.controller';
import { InvoicesModule } from '../invoices/invoices.module';
import { CommonModule } from '../common/common.module';
import { AccountingModule } from '../accounting/accounting.module';


@Module({
	imports: [InvoicesModule, CommonModule, AccountingModule],
	controllers: [QuotesController, PublicQuotesController],
	providers: [QuotesService]
})
export class QuotesModule {}


