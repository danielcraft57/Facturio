import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BillingModule } from '../billing/billing.module';
import { AccountingModule } from '../accounting/accounting.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { PayablesController } from './payables.controller';
import { PublicPayablesController } from './public-payables.controller';
import { PayablesService } from './payables.service';
import { PayablesDebtSendService } from './payables-debt-send.service';

@Module({
	imports: [PrismaModule, BillingModule, AccountingModule, OrganizationsModule, RealtimeModule],
	controllers: [PayablesController, PublicPayablesController],
	providers: [PayablesService, PayablesDebtSendService],
	exports: [PayablesService, PayablesDebtSendService],
})
export class PayablesModule {}
