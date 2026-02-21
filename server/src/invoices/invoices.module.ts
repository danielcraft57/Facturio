import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController, PublicInvoicesController } from './invoices.controller';
import { CommonModule } from '../common/common.module';
import { AccountingModule } from '../accounting/accounting.module';
import { ConfigModule } from '../config/config.module';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
	imports: [CommonModule, AccountingModule, ConfigModule, OrganizationsModule],
	controllers: [InvoicesController, PublicInvoicesController],
	providers: [InvoicesService],
	exports: [InvoicesService]
})
export class InvoicesModule {}


