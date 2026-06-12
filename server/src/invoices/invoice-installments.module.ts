import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InvoiceInstallmentsService } from './invoice-installments.service';

/**
 * Module échéanciers facture — exporté pour Stripe et Payments.
 */
@Module({
	imports: [PrismaModule],
	providers: [InvoiceInstallmentsService],
	exports: [InvoiceInstallmentsService],
})
export class InvoiceInstallmentsModule {}
