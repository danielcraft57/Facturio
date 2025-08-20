import { Module } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { PublicQuotesController, QuotesController } from './quotes.controller';
import { InvoicesModule } from '../invoices/invoices.module';
import { CommonModule } from '../common/common.module';

@Module({
	imports: [InvoicesModule, CommonModule],
	controllers: [QuotesController, PublicQuotesController],
	providers: [QuotesService]
})
export class QuotesModule {}


