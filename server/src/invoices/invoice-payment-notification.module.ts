import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { PrismaModule } from '../prisma/prisma.module';
import { InvoicePaymentNotificationService } from './invoice-payment-notification.service';

@Module({
	imports: [PrismaModule, ConfigModule],
	providers: [InvoicePaymentNotificationService],
	exports: [InvoicePaymentNotificationService],
})
export class InvoicePaymentNotificationModule {}
