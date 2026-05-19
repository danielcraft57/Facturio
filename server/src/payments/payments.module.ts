import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AccountingModule } from '../accounting/accounting.module';
import { InvoicePaymentNotificationModule } from '../invoices/invoice-payment-notification.module';

@Module({
	imports: [PrismaModule, AccountingModule, InvoicePaymentNotificationModule],
	controllers: [PaymentsController],
	providers: [PaymentsService],
	exports: [PaymentsService]
})
export class PaymentsModule {}




