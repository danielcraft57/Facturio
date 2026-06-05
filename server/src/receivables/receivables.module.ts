import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { ReceivablesController } from './receivables.controller';
import { ReceivablesReminderService } from './receivables-reminder.service';
import { ReceivablesService } from './receivables.service';

@Module({
	imports: [PrismaModule, InvoicesModule, OrganizationsModule],
	controllers: [ReceivablesController],
	providers: [ReceivablesService, ReceivablesReminderService],
	exports: [ReceivablesService, ReceivablesReminderService],
})
export class ReceivablesModule {}
