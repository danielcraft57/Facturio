import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { CommonModule } from '../common/common.module';
import { AccountingModule } from '../accounting/accounting.module';
import { ConfigModule } from '../config/config.module';

@Module({
	imports: [CommonModule, AccountingModule, ConfigModule],
	controllers: [InvoicesController],
	providers: [InvoicesService],
	exports: [InvoicesService]
})
export class InvoicesModule {}


